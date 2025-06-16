// pages/MyPageCart.js
import React, { useEffect, useState } from "react";
import MyPageHeader from "../components/MyPageHeader";
import API from "../utils/api"; // axios 인스턴스 import
import "../styles/mypage.css";

const MyPageCart = () => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [updateLoading, setUpdateLoading] = useState(false);

  // 주문 모달 상태
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    name: "",
    address: "",
    zipcode: "",
    addrDetail: "",
    phoneNum: "",
    requirement: "",
    payType: ""
  });
  const [orderLoading, setOrderLoading] = useState(false);

  // 결제 방법 옵션
  const payTypeOptions = [
    { value: "CARD", label: "카드결제" },
    { value: "CASH", label: "현금결제" },
    { value: "BANK_TRANSFER", label: "계좌이체" }
  ];

  // 장바구니 조회
  const fetchCart = async () => {
    try {
      setLoading(true);

      const response = await API.get("/carts");
      console.log("장바구니 응답:", response.data);

      setCart(response.data.content);
      setError("");
    } catch (err) {
      console.error("장바구니 조회 오류:", err);
      if (err.response?.status === 401) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
      } else {
        setError(err.response?.data?.message || "장바구니를 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 수량 업데이트
  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdateLoading(true);

      await API.patch(`/carts/items/${cartItemId}`, {
        quantity: newQuantity
      });

      await fetchCart();
      setError("");
    } catch (err) {
      console.error("수량 업데이트 오류:", err);
      setError(err.response?.data?.message || "수량 변경에 실패했습니다.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // 장바구니 아이템 삭제
  const removeItem = async (itemId) => {
    if (!window.confirm("해당 상품을 장바구니에서 삭제하시겠습니까?")) {
      return;
    }

    try {
      setUpdateLoading(true);

      await API.delete(`/carts/items/${itemId}`);

      await fetchCart();
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      setError("");
    } catch (err) {
      console.error("상품 삭제 오류:", err);
      setError(err.response?.data?.message || "상품 삭제에 실패했습니다.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // 장바구니 비우기
  const clearCart = async () => {
    if (!window.confirm("장바구니를 비우시겠습니까?")) {
      return;
    }

    try {
      setUpdateLoading(true);

      await API.delete("/carts");

      await fetchCart();
      setSelectedItems(new Set());
      setError("");
    } catch (err) {
      console.error("장바구니 비우기 오류:", err);
      setError(err.response?.data?.message || "장바구니 비우기에 실패했습니다.");
    } finally {
      setUpdateLoading(false);
    }
  };

  // 전체 선택/해제
  const toggleAllSelection = () => {
    if (selectedItems.size === cart?.items?.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(cart?.items?.map(item => item.id) || []));
    }
  };

  // 개별 선택/해제
  const toggleItemSelection = (cartItemId) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cartItemId)) {
        newSet.delete(cartItemId);
      } else {
        newSet.add(cartItemId);
      }
      return newSet;
    });
  };

  // 선택된 상품의 총 가격 계산
  const calculateSelectedTotal = () => {
    if (!cart?.items) return 0;
    return cart.items
    .filter(item => selectedItems.has(item.id))
    .reduce((total, item) => total + item.totalPrice, 0);
  };

  // 주문 모달 열기
  const openOrderModal = () => {
    if (selectedItems.size === 0) {
      alert("주문할 상품을 선택해주세요.");
      return;
    }
    setShowOrderModal(true);
  };

  // 주문 모달 닫기
  const closeOrderModal = () => {
    setShowOrderModal(false);
    setOrderForm({
      name: "",
      address: "",
      zipcode: "",
      addrDetail: "",
      phoneNum: "",
      requirement: "",
      payType: ""
    });
  };

  // 주문 생성
  const createOrder = async () => {
    // 폼 검증
    if (!orderForm.name.trim()) {
      alert("받으시는 분 이름을 입력해주세요.");
      return;
    }
    if (!orderForm.address.trim()) {
      alert("받으시는 분 주소를 입력해주세요.");
      return;
    }
    if (!orderForm.zipcode.trim()) {
      alert("우편번호를 입력해주세요.");
      return;
    }
    if (!/^\d{5,6}$/.test(orderForm.zipcode)) {
      alert("우편번호는 5~6자리 숫자여야 합니다.");
      return;
    }
    if (!orderForm.addrDetail.trim()) {
      alert("상세주소를 입력해주세요.");
      return;
    }
    if (!orderForm.phoneNum.trim()) {
      alert("전화번호를 입력해주세요.");
      return;
    }
    if (!/^\d{10,11}$/.test(orderForm.phoneNum.replace(/-/g, ''))) {
      alert("전화번호는 10~11자리 숫자여야 합니다.");
      return;
    }
    if (!orderForm.payType) {
      alert("결제방식을 선택해주세요.");
      return;
    }

    try {
      setOrderLoading(true);

      const orderRequest = {
        name: orderForm.name.trim(),
        address: orderForm.address.trim(),
        zipcode: orderForm.zipcode.trim(),
        addrDetail: orderForm.addrDetail.trim(),
        phoneNum: orderForm.phoneNum.replace(/-/g, ''), // 하이픈 제거
        requirement: orderForm.requirement.trim() || null,
        payType: orderForm.payType,
        cartItemIds: Array.from(selectedItems)
      };

      console.log("주문 요청 데이터:", orderRequest);

      await API.post("/orders", orderRequest);

      alert("주문이 완료되었습니다!");

      // 주문 완료 후 처리
      closeOrderModal();
      await fetchCart(); // 장바구니 새로고침
      setSelectedItems(new Set()); // 선택 항목 초기화

      // 주문 내역 페이지로 이동 (옵션)
      // window.location.href = '/mypage/orders';

    } catch (err) {
      console.error("주문 생성 오류:", err);
      const errorMessage = err.response?.data?.message || "주문 처리 중 오류가 발생했습니다.";
      alert(errorMessage);
    } finally {
      setOrderLoading(false);
    }
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 우편번호 포맷팅
  const formatZipcode = (value) => {
    return value.replace(/[^\d]/g, '').slice(0, 6);
  };

  useEffect(() => {
    fetchCart();
  }, []);

  if (loading) {
    return (
        <div className="mypage_main">
          <MyPageHeader />
          <div className="mypage_contents">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>장바구니를 불러오는 중...</p>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="mypage_main">
        <MyPageHeader />
        <div className="mypage_contents">
          <div className="page-title-section">
            <h1 className="page-title">🛒 장바구니</h1>
            <p className="page-description">장바구니에 담은 상품을 확인하고 관리하세요</p>
          </div>

          {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
          )}

          {!cart?.items || cart.items.length === 0 ? (
              <div className="empty-cart">
                <div className="empty-icon">🛒</div>
                <h3>장바구니가 비어있습니다</h3>
                <p>주짓수 용품을 둘러보고 원하는 상품을 담아보세요!</p>
                <button
                    className="btn-primary"
                    onClick={() => window.location.href = '/store'}
                >
                  스토어 둘러보기
                </button>
              </div>
          ) : (
              <div className="cart-container">
                {/* 장바구니 헤더 */}
                <div className="cart-header">
                  <div className="cart-controls">
                    <label className="checkbox-label">
                      <input
                          type="checkbox"
                          checked={selectedItems.size === cart.items.length}
                          onChange={toggleAllSelection}
                      />
                      <span className="checkmark"></span>
                      전체선택 ({selectedItems.size}/{cart.items.length})
                    </label>
                    <button
                        className="btn-outline btn-sm"
                        onClick={clearCart}
                        disabled={updateLoading}
                    >
                      장바구니 비우기
                    </button>
                  </div>
                </div>

                {/* 장바구니 아이템 목록 */}
                <div className="cart-items">
                  {cart.items.map((item) => (
                      <div key={`${item.itemId}-${item.id}`} className="cart-item">
                        <div className="item-select">
                          <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={selectedItems.has(item.id)}
                                onChange={() => toggleItemSelection(item.id)}
                            />
                            <span className="checkmark"></span>
                          </label>
                        </div>

                        <div className="item-info">
                          <h4 className="item-name">{item.itemName}</h4>
                          <div className="item-details">
                            <div className="selected-options">
                              {item.itemOption && (
                                  <>
                                    {item.itemOption.size && (
                                        <span className="option-tag size-tag">
                                          <span className="option-icon">📏</span>
                                          사이즈: {item.itemOption.size}
                                        </span>
                                    )}
                                    {item.itemOption.color && (
                                        <span className="option-tag color-tag">
                                          <span className="option-icon">🎨</span>
                                          색상: {item.itemOption.color}
                                        </span>
                                    )}
                                  </>
                              )}
                            </div>

                            {item.isPriceChanged && (
                                <span className="price-change-badge">가격 변동</span>
                            )}
                          </div>
                        </div>

                        <div className="item-price">
                          {item.isPriceChanged ? (
                              <div className="price-comparison">
                                <span className="old-price">₩{item.price?.toLocaleString()}</span>
                                <span className="current-price">₩{item.currentPrice?.toLocaleString()}</span>
                              </div>
                          ) : (
                              <span className="price">₩{item.currentPrice?.toLocaleString()}</span>
                          )}
                        </div>

                        <div className="item-quantity">
                          <div className="quantity-controls">
                            <button
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={updateLoading || item.quantity <= 1}
                            >
                              -
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={updateLoading}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="item-total">
                          <span className="total-price">₩{item.totalPrice?.toLocaleString()}</span>
                        </div>

                        <div className="item-actions">
                          <button
                              className="btn-outline btn-sm delete-btn"
                              onClick={() => removeItem(item.itemId)}
                              disabled={updateLoading}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                  ))}
                </div>

                {/* 주문 요약 */}
                <div className="cart-summary">
                  <div className="summary-card">
                    <div className="summary-row">
                      <span>전체 상품 ({cart?.items?.length || 0}개)</span>
                      <span className="summary-price">₩{cart?.totalPrice?.toLocaleString() || '0'}</span>
                    </div>
                    <div className="summary-row">
                      <span>선택 상품 ({selectedItems.size}개)</span>
                      <span className="summary-price">₩{calculateSelectedTotal().toLocaleString()}</span>
                    </div>
                    <div className="summary-row">
                      <span>배송비</span>
                      <span className="summary-price">
                        {calculateSelectedTotal() >= 50000 ? '무료' : '₩3,000'}
                      </span>
                    </div>
                    <div className="summary-divider"></div>
                    <div className="summary-row total">
                      <span>총 결제금액</span>
                      <span className="total-price">
                        ₩{(calculateSelectedTotal() + (calculateSelectedTotal() >= 50000 ? 0 : 3000)).toLocaleString()}
                      </span>
                    </div>
                    <div className="delivery-info">
                      <p>🚚 50,000원 이상 주문 시 무료배송</p>
                    </div>
                    <div className="summary-actions">
                      <button
                          className="btn-primary btn-lg order-btn"
                          onClick={openOrderModal}
                          disabled={selectedItems.size === 0 || updateLoading}
                      >
                        주문하기 ({selectedItems.size}개)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
          )}

          {updateLoading && (
              <div className="loading-overlay">
                <div className="loading-overlay-content">
                  <div className="spinner"></div>
                  <p>처리 중...</p>
                </div>
              </div>
          )}

          {/* 주문 정보 입력 모달 */}
          {showOrderModal && (
              <div className="modern-modal-overlay" onClick={closeOrderModal}>
                <div className="modern-modal-content order-modal" onClick={(e) => e.stopPropagation()}>
                  {/* 모달 헤더 */}
                  <div className="modern-modal-header order-header">
                    <div className="modal-title-section">
                      <div className="modal-icon order-icon">
                        <span>🛒</span>
                      </div>
                      <h3 className="modal-title">주문 정보 입력</h3>
                    </div>
                    <button
                        className="modern-modal-close"
                        onClick={closeOrderModal}
                        disabled={orderLoading}
                    >
                      ×
                    </button>
                  </div>

                  {/* 모달 바디 */}
                  <div className="modern-modal-body">
                    <div className="order-summary-section">
                      <h4 className="section-title">주문 상품</h4>
                      <div className="selected-items-summary">
                        {cart?.items?.filter(item => selectedItems.has(item.id)).map(item => (
                            <div key={item.id} className="summary-item">
                              <span className="item-name">{item.itemName}</span>
                              <span className="item-quantity">×{item.quantity}</span>
                              <span className="item-price">₩{item.totalPrice.toLocaleString()}</span>
                            </div>
                        ))}
                      </div>
                      <div className="order-total">
                        <strong>총 결제금액: ₩{(calculateSelectedTotal() + (calculateSelectedTotal() >= 50000 ? 0 : 3000)).toLocaleString()}</strong>
                      </div>
                    </div>

                    <div className="delivery-form-section">
                      <h4 className="section-title">배송 정보</h4>

                      <div className="modern-form-group">
                        <label className="modern-form-label">
                          받으시는 분 <span className="required-mark">*</span>
                        </label>
                        <input
                            type="text"
                            value={orderForm.name}
                            onChange={(e) => setOrderForm(prev => ({...prev, name: e.target.value}))}
                            placeholder="받으시는 분 이름을 입력해주세요"
                            className="modern-form-input"
                            disabled={orderLoading}
                        />
                      </div>

                      <div className="form-row">
                        <div className="modern-form-group">
                          <label className="modern-form-label">
                            우편번호 <span className="required-mark">*</span>
                          </label>
                          <input
                              type="text"
                              value={orderForm.zipcode}
                              onChange={(e) => setOrderForm(prev => ({...prev, zipcode: formatZipcode(e.target.value)}))}
                              placeholder="12345"
                              className="modern-form-input"
                              maxLength="6"
                              disabled={orderLoading}
                          />
                        </div>
                        <div className="modern-form-group">
                          <label className="modern-form-label">
                            전화번호 <span className="required-mark">*</span>
                          </label>
                          <input
                              type="text"
                              value={orderForm.phoneNum}
                              onChange={(e) => setOrderForm(prev => ({...prev, phoneNum: formatPhoneNumber(e.target.value)}))}
                              placeholder="010-1234-5678"
                              className="modern-form-input"
                              disabled={orderLoading}
                          />
                        </div>
                      </div>

                      <div className="modern-form-group">
                        <label className="modern-form-label">
                          주소 <span className="required-mark">*</span>
                        </label>
                        <input
                            type="text"
                            value={orderForm.address}
                            onChange={(e) => setOrderForm(prev => ({...prev, address: e.target.value}))}
                            placeholder="기본 주소를 입력해주세요"
                            className="modern-form-input"
                            disabled={orderLoading}
                        />
                      </div>

                      <div className="modern-form-group">
                        <label className="modern-form-label">
                          상세주소 <span className="required-mark">*</span>
                        </label>
                        <input
                            type="text"
                            value={orderForm.addrDetail}
                            onChange={(e) => setOrderForm(prev => ({...prev, addrDetail: e.target.value}))}
                            placeholder="상세주소를 입력해주세요"
                            className="modern-form-input"
                            disabled={orderLoading}
                        />
                      </div>

                      <div className="modern-form-group">
                        <label className="modern-form-label">배송 요청사항</label>
                        <textarea
                            value={orderForm.requirement}
                            onChange={(e) => setOrderForm(prev => ({...prev, requirement: e.target.value}))}
                            placeholder="배송 시 요청사항이 있으시면 입력해주세요"
                            className="modern-form-textarea"
                            rows="3"
                            disabled={orderLoading}
                        />
                      </div>

                      <div className="modern-form-group">
                        <label className="modern-form-label">
                          결제방식 <span className="required-mark">*</span>
                        </label>
                        <div className="payment-options">
                          {payTypeOptions.map(option => (
                              <label key={option.value} className="payment-option">
                                <input
                                    type="radio"
                                    name="payType"
                                    value={option.value}
                                    checked={orderForm.payType === option.value}
                                    onChange={(e) => setOrderForm(prev => ({...prev, payType: e.target.value}))}
                                    disabled={orderLoading}
                                />
                                <span className="payment-label">{option.label}</span>
                              </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 모달 푸터 */}
                  <div className="modern-modal-footer">
                    <button
                        className="modern-btn modern-btn-outline"
                        onClick={closeOrderModal}
                        disabled={orderLoading}
                    >
                      취소
                    </button>
                    <button
                        className="modern-btn modern-btn-primary"
                        onClick={createOrder}
                        disabled={orderLoading}
                    >
                      {orderLoading && (
                          <div className="btn-spinner"></div>
                      )}
                      {orderLoading ? "주문 처리 중..." : "주문 완료"}
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default MyPageCart;