// pages/MyPageCart.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MyPageHeader from "../../components/MyPageHeader";
import API from "../../utils/api"; // axios 인스턴스 import
import "../../styles/mypage.css";

const MyPageCart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [updateLoading, setUpdateLoading] = useState(false);

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
  const removeItem = async (cartItemId) => {
    if (!window.confirm("해당 상품을 장바구니에서 삭제하시겠습니까?")) {
      return;
    }

    try {
      setUpdateLoading(true);

      await API.delete(`/carts/items/${cartItemId}`);

      await fetchCart();
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(cartItemId);
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

  // 주문 페이지로 이동
  const goToOrderPage = () => {
    if (selectedItems.size === 0) {
      alert("주문할 상품을 선택해주세요.");
      return;
    }

    // 선택된 상품들을 주문 형태로 변환
    const selectedCartItems = cart.items.filter(item => selectedItems.has(item.id));

    const orderItems = selectedCartItems.map(cartItem => ({
      id: cartItem.itemId,
      name: cartItem.itemName,
      price: cartItem.currentPrice,
      image: cartItem.itemImage || null, // 장바구니에 이미지 정보가 있다면 사용
      quantity: cartItem.quantity,
      option: cartItem.itemOption,
      totalPrice: cartItem.totalPrice,
      cartItemId: cartItem.id // 주문 완료 후 장바구니에서 제거하기 위해 필요
    }));

    const totalPrice = calculateSelectedTotal();

    // localStorage에 임시 저장
    localStorage.setItem("tempOrderItems", JSON.stringify(orderItems));
    localStorage.setItem("tempOrderTotalPrice", totalPrice);
    localStorage.setItem("selectedCartItemIds", JSON.stringify(Array.from(selectedItems)));

    // 주문 페이지로 이동
    navigate("/order/new");
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
                                <span className="old-price">₩{item.currentPrice?.toLocaleString()}</span>
                                <span className="current-price">₩{item.price?.toLocaleString()}</span>
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
                              onClick={() => removeItem(item.id)}
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
                          onClick={goToOrderPage}
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
        </div>
      </div>
  );
};

export default MyPageCart;