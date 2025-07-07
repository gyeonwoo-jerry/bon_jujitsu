import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import AddressSearch from "../components/admin/AddressSearch";
import "../styles/Order.css";

const Order = () => {
  const navigate = useNavigate();

  // 주문 상품 정보
  const [orderItems, setOrderItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // 배송 정보
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: "",
    address: "",
    zipcode: "",
    addrDetail: "",
    phoneNum: "",
    requirement: ""
  });

  // 주소 검색 관련
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedSido, setSelectedSido] = useState("");

  // 결제 정보
  const [payType, setPayType] = useState("");

  // 상태 관리
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 컴포넌트 마운트 시 임시 주문 데이터 로드
  useEffect(() => {
    loadOrderData();
    loadUserInfo();
  }, []);

  // 임시 주문 데이터 로드
  const loadOrderData = () => {
    try {
      const tempOrderItems = localStorage.getItem("tempOrderItems");
      const tempTotalPrice = localStorage.getItem("tempOrderTotalPrice");

      if (!tempOrderItems || !tempTotalPrice) {
        alert("주문 정보가 없습니다. 상품 페이지로 돌아갑니다.");
        navigate(-1);
        return;
      }

      setOrderItems(JSON.parse(tempOrderItems));
      setTotalPrice(parseInt(tempTotalPrice));
    } catch (error) {
      console.error("주문 데이터 로드 실패:", error);
      alert("주문 정보를 불러오는데 실패했습니다.");
      navigate(-1);
    }
  };

  // 사용자 정보 로드 (기본값 설정)
  const loadUserInfo = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      if (userInfo.name && userInfo.phoneNum) {
        setDeliveryInfo(prev => ({
          ...prev,
          name: userInfo.name,
          phoneNum: userInfo.phoneNum
        }));
      }
    } catch (error) {
      console.error("사용자 정보 로드 실패:", error);
    }
  };

  // 입력값 변경 처리
  const handleInputChange = (field, value) => {
    setDeliveryInfo(prev => ({
      ...prev,
      [field]: value
    }));

    // 에러 메시지 제거
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // 결제 방식 변경 처리
  const handlePayTypeChange = (value) => {
    setPayType(value);
    if (errors.payType) {
      setErrors(prev => ({
        ...prev,
        payType: ""
      }));
    }
  };

  // 유효성 검사
  const validateForm = () => {
    const newErrors = {};

    if (!deliveryInfo.name.trim()) {
      newErrors.name = "받으시는 분 이름을 입력해주세요";
    }

    if (!deliveryInfo.address.trim()) {
      newErrors.address = "주소를 입력해주세요";
    }

    if (!deliveryInfo.zipcode.trim()) {
      newErrors.zipcode = "우편번호를 입력해주세요";
    } else if (!/^\d{5,6}$/.test(deliveryInfo.zipcode)) {
      newErrors.zipcode = "우편번호는 5~6자리 숫자여야 합니다";
    }

    if (!deliveryInfo.addrDetail.trim()) {
      newErrors.addrDetail = "상세주소를 입력해주세요";
    }

    if (!deliveryInfo.phoneNum.trim()) {
      newErrors.phoneNum = "전화번호를 입력해주세요";
    } else if (!/^\d{10,11}$/.test(deliveryInfo.phoneNum.replace(/-/g, ""))) {
      newErrors.phoneNum = "전화번호는 10~11자리 숫자여야 합니다";
    }

    if (!payType) {
      newErrors.payType = "결제방식을 선택해주세요";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 주소 선택 처리
  const handleAddressSelect = (fullAddress, sido, zonecode) => {
    setSelectedAddress(fullAddress);
    setSelectedSido(sido);

    // 주소와 우편번호 설정
    setDeliveryInfo(prev => ({
      ...prev,
      address: fullAddress,
      zipcode: zonecode || ""
    }));

    // 에러 메시지 제거
    if (errors.address) {
      setErrors(prev => ({
        ...prev,
        address: "",
        zipcode: ""
      }));
    }
  };

  // 주문 처리
  const handleOrder = async () => {
    if (!validateForm()) {
      return;
    }

    if (orderItems.length === 0) {
      alert("주문할 상품이 없습니다.");
      return;
    }

    setLoading(true);

    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userId = userInfo.id;

      if (!userId) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }

      // 장바구니에서 온 경우와 직접 구매의 경우를 구분
      const selectedCartItemIds = localStorage.getItem("selectedCartItemIds");

      if (selectedCartItemIds) {
        // 장바구니에서 온 경우: 기존 orders API 사용
        const cartItemIds = JSON.parse(selectedCartItemIds);

        const orderRequest = {
          name: deliveryInfo.name,
          address: deliveryInfo.address,
          zipcode: deliveryInfo.zipcode,
          addrDetail: deliveryInfo.addrDetail,
          phoneNum: deliveryInfo.phoneNum.replace(/-/g, ""),
          requirement: deliveryInfo.requirement,
          payType: payType,
          cartItemIds: cartItemIds
        };

        console.log("장바구니 주문 요청 데이터:", orderRequest);

        const response = await API.post('/orders', orderRequest);

        if (response.status === 200 || response.status === 201) {
          // 장바구니 주문 데이터 정리
          localStorage.removeItem("tempOrderItems");
          localStorage.removeItem("tempOrderTotalPrice");
          localStorage.removeItem("selectedCartItemIds");

          alert("주문이 완료되었습니다!");
          navigate("/mypage/orders");
        } else {
          throw new Error("주문 처리에 실패했습니다.");
        }

      } else {
        // 직접 구매의 경우: 직접 주문 API 사용
        const directOrderRequest = {
          name: deliveryInfo.name,
          address: deliveryInfo.address,
          zipcode: deliveryInfo.zipcode,
          addrDetail: deliveryInfo.addrDetail,
          phoneNum: deliveryInfo.phoneNum.replace(/-/g, ""),
          requirement: deliveryInfo.requirement,
          payType: payType,
          orderItems: orderItems.map(item => ({
            itemId: item.id,
            itemOptionId: item.option.id,
            quantity: item.quantity
          }))
        };

        console.log("직접 주문 요청 데이터:", directOrderRequest);

        const response = await API.post('/orders/direct', directOrderRequest);

        if (response.status === 200 || response.status === 201) {
          // 직접 주문 데이터 정리
          localStorage.removeItem("tempOrderItems");
          localStorage.removeItem("tempOrderTotalPrice");

          alert("주문이 완료되었습니다!");
          navigate("/mypage/orders");
        } else {
          throw new Error("주문 처리에 실패했습니다.");
        }
      }

    } catch (error) {
      console.error("주문 처리 실패:", error);

      let errorMessage = "주문 처리 중 오류가 발생했습니다.";

      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 가격 포맷팅
  const formatPrice = (price) => {
    if (!price && price !== 0) return "0원";
    return price.toLocaleString("ko-KR") + "원";
  };

  // 이미지 URL 처리
  const getImageUrl = (imageUrl) => {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return "/images/blank_img.png";
    }

    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    return imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
  };

  // 옵션 표시 텍스트
  const getOptionDisplayText = (option) => {
    if (!option) return "기본 옵션";

    const parts = [];
    if (option.size && option.size !== "NONE") parts.push(`사이즈: ${option.size}`);
    if (option.color && option.color !== "DEFAULT") parts.push(`색상: ${option.color}`);
    return parts.length > 0 ? parts.join(" / ") : "기본 옵션";
  };

  return (
      <div className="order-page">
        <div className="order-container">
          <h1 className="order-title">주문하기</h1>

          {/* 주문 상품 정보 */}
          <div className="order-section">
            <h2 className="section-title">주문 상품</h2>
            <div className="order-items">
              {orderItems.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-image">
                      <img
                          src={getImageUrl(item.image)}
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = "/images/blank_img.png";
                          }}
                      />
                    </div>
                    <div className="item-info">
                      <h3 className="item-name">{item.name}</h3>
                      <p className="item-option">{getOptionDisplayText(item.option)}</p>
                      <div className="item-price-info">
                        <span className="item-price">{formatPrice(item.price)}</span>
                        <span className="item-quantity">수량: {item.quantity}개</span>
                        <span className="item-total">{formatPrice(item.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
              ))}
            </div>
          </div>

          {/* 배송 정보 */}
          <div className="order-section">
            <h2 className="section-title">배송 정보</h2>
            <div className="delivery-form">
              <div className="form-row">
                <label className="form-label">받으시는 분</label>
                <input
                    type="text"
                    className={`form-input ${errors.name ? "error" : ""}`}
                    value={deliveryInfo.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="받으시는 분 이름을 입력해주세요"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-row">
                <label className="form-label">주소</label>
                <AddressSearch
                    onAddressSelect={handleAddressSelect}
                    selectedAddress={selectedAddress}
                />
                {errors.address && <span className="error-message">{errors.address}</span>}

                <input
                    type="text"
                    className={`form-input ${errors.zipcode ? "error" : ""}`}
                    value={deliveryInfo.zipcode}
                    onChange={(e) => handleInputChange("zipcode", e.target.value)}
                    placeholder="우편번호 (5-6자리 숫자)"
                />
                {errors.zipcode && <span className="error-message">{errors.zipcode}</span>}

                <input
                    type="text"
                    className={`form-input ${errors.addrDetail ? "error" : ""}`}
                    value={deliveryInfo.addrDetail}
                    onChange={(e) => handleInputChange("addrDetail", e.target.value)}
                    placeholder="상세 주소를 입력해주세요"
                />
                {errors.addrDetail && <span className="error-message">{errors.addrDetail}</span>}
              </div>

              <div className="form-row">
                <label className="form-label">전화번호</label>
                <input
                    type="text"
                    className={`form-input ${errors.phoneNum ? "error" : ""}`}
                    value={deliveryInfo.phoneNum}
                    onChange={(e) => handleInputChange("phoneNum", e.target.value)}
                    placeholder="전화번호를 입력해주세요 (숫자만)"
                />
                {errors.phoneNum && <span className="error-message">{errors.phoneNum}</span>}
              </div>

              <div className="form-row">
                <label className="form-label">배송 요청사항</label>
                <textarea
                    className="form-textarea"
                    value={deliveryInfo.requirement}
                    onChange={(e) => handleInputChange("requirement", e.target.value)}
                    placeholder="배송 시 요청사항을 입력해주세요 (선택사항)"
                    rows="3"
                />
              </div>
            </div>
          </div>

          {/* 결제 정보 */}
          <div className="order-section">
            <h2 className="section-title">결제 정보</h2>
            <div className="payment-form">
              <div className="payment-methods">
                <label className="payment-option">
                  <input
                      type="radio"
                      name="payType"
                      value="CARD"
                      checked={payType === "CARD"}
                      onChange={(e) => handlePayTypeChange(e.target.value)}
                  />
                  <span className="payment-label">신용카드</span>
                </label>

                <label className="payment-option">
                  <input
                      type="radio"
                      name="payType"
                      value="ACCOUNT_TRANSFER"
                      checked={payType === "ACCOUNT_TRANSFER"}
                      onChange={(e) => handlePayTypeChange(e.target.value)}
                  />
                  <span className="payment-label">계좌이체</span>
                </label>
              </div>
              {errors.payType && <span className="error-message">{errors.payType}</span>}
            </div>
          </div>

          {/* 주문 요약 */}
          <div className="order-section">
            <h2 className="section-title">주문 요약</h2>
            <div className="order-summary">
              <div className="summary-row">
                <span className="summary-label">상품 금액</span>
                <span className="summary-value">{formatPrice(totalPrice)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">배송비</span>
                <span className="summary-value">무료</span>
              </div>
              <div className="summary-row total">
                <span className="summary-label">총 결제 금액</span>
                <span className="summary-value">{formatPrice(totalPrice)}</span>
              </div>
            </div>
          </div>

          {/* 주문 버튼 */}
          <div className="order-actions">
            <button
                className="cancel-btn"
                onClick={() => navigate(-1)}
                disabled={loading}
            >
              취소
            </button>
            <button
                className="order-btn"
                onClick={handleOrder}
                disabled={loading}
            >
              {loading ? "주문 처리 중..." : `${formatPrice(totalPrice)} 결제하기`}
            </button>
          </div>
        </div>
      </div>
  );
};

export default Order;