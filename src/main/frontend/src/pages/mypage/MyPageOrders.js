// pages/MyPageOrders.js
import React, { useEffect, useState } from "react";
import MyPageHeader from "../../components/MyPageHeader";
import API from "../../utils/api";
import "../../styles/mypage.css";

const MyPageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    size: 10,
    totalPage: 1
  });
  const [selectedStatus, setSelectedStatus] = useState([]);

  // 모달 상태
  const [showCancelModal, setShowCancelModal] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(null);
  const [orderDetail, setOrderDetail] = useState(null);
  const [cancelForm, setCancelForm] = useState({ reason: "", description: "" });
  const [returnForm, setReturnForm] = useState({ reason: "", description: "", images: [] });

  // 주문 상태 옵션
  const statusOptions = [
    { value: [], label: "전체", color: "gray" },
    { value: ["WAITING"], label: "주문대기", color: "orange" },
    { value: ["DELIVERING"], label: "배송중", color: "blue" },
    { value: ["COMPLETE"], label: "배송완료", color: "green" },
    { value: ["CANCELLED"], label: "주문취소", color: "red" },
    { value: ["RETURN_REQUESTED"], label: "반품신청", color: "yellow" },
    { value: ["RETURNING"], label: "반품중", color: "yellow" },
    { value: ["RETURNED"], label: "반품완료", color: "gray" },
  ];

  // 취소 사유 옵션
  const cancelReasons = [
    "단순 변심",
    "다른 상품 주문",
    "가격 변동",
    "배송 관련",
    "기타"
  ];

  // 반품 사유 옵션
  const returnReasons = [
    "상품 불량/하자",
    "상품 정보 상이",
    "배송 중 파손",
    "사이즈/색상 불만족",
    "기타"
  ];

  // 주문 상태별 한글 표시
  const getStatusLabel = (status) => {
    const statusMap = {
      WAITING: "주문대기",
      DELIVERING: "배송중",
      COMPLETE: "배송완료",
      CANCELLED: "주문취소",
      RETURN_REQUESTED: "반품신청",
      RETURNING: "반품중",
      RETURNED: "반품완료",
      REFUNDED: "환불완료"
    };
    return statusMap[status] || status;
  };

  // 주문 상태별 색상
  const getStatusColor = (status) => {
    const colorMap = {
      WAITING: "orange",
      DELIVERING: "blue",
      COMPLETE: "green",
      CANCELLED: "red",
      RETURN_REQUESTED: "yellow",
      RETURNING: "yellow",
      RETURNED: "gray",
      REFUNDED: "gray"
    };
    return colorMap[status] || "gray";
  };

  // 결제 방법 정보 (아이콘 포함)
  const getPayTypeInfo = (payType) => {
    const payTypeMap = {
      CARD: { label: "카드결제", icon: "💳", color: "card" },
      CASH: { label: "현금결제", icon: "💵", color: "cash" },
      BANK_TRANSFER: { label: "계좌이체", icon: "🏦", color: "bank" }
    };
    return payTypeMap[payType] || { label: payType, icon: "💰", color: "default" };
  };

  // 내 주문 조회
  const fetchOrders = async (page = 1, status = selectedStatus) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        size: pagination.size.toString()
      });

      // 상태 필터 추가
      if (status && status.length > 0) {
        status.forEach(s => params.append('status', s));
      }

      const response = await API.get(`/orders/myself?${params}`);
      console.log("주문 목록 응답:", response.data);

      const { list, page: currentPage, size, totalPage } = response.data.content;
      setOrders(list || []);
      setPagination({ page: currentPage, size, totalPage });
      setError("");
    } catch (err) {
      console.error("주문 조회 오류:", err);
      if (err.response?.status === 401) {
        setError("로그인이 필요합니다. 다시 로그인해주세요.");
      } else {
        setError(err.response?.data?.message || "주문 내역을 불러오는데 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 주문 상세 조회 - getMyOrders API 활용
  const fetchOrderDetail = async (orderId) => {
    try {
      setActionLoading(true);
      setError(""); // 기존 에러 클리어

      console.log("주문 상세 조회 시작:", orderId);

      // 이미 로드된 orders에서 먼저 찾기
      const existingOrder = orders.find(order => order.id === parseInt(orderId));
      if (existingOrder) {
        console.log("기존 데이터에서 주문 발견:", existingOrder);
        setOrderDetail(existingOrder);
        setShowDetailModal(orderId);
        return;
      }

      // getMyOrders API를 활용해서 해당 주문이 포함된 페이지를 찾기
      // 먼저 전체 주문을 조회 (상태 필터 없이)
      const response = await API.get(`/orders/myself?page=1&size=100`);
      console.log("전체 주문 목록 응답:", response.data);

      if (response.data.success && response.data.content && response.data.content.list) {
        const allOrders = response.data.content.list;
        const targetOrder = allOrders.find(order => order.id === parseInt(orderId));

        if (targetOrder) {
          console.log("주문 상세 데이터 발견:", targetOrder);
          setOrderDetail(targetOrder);
          setShowDetailModal(orderId);
        } else {
          throw new Error("해당 주문을 찾을 수 없습니다.");
        }
      } else {
        throw new Error("주문 목록을 가져오는데 실패했습니다.");
      }

    } catch (err) {
      console.error("주문 상세 조회 실패:", err);
      console.error("에러 상세:", {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });

      let errorMessage = "주문 상세 정보를 불러오는데 실패했습니다.";

      if (err.response?.status === 404) {
        errorMessage = "해당 주문을 찾을 수 없습니다.";
      } else if (err.response?.status === 403) {
        errorMessage = "주문 정보에 접근할 권한이 없습니다.";
      } else if (err.response?.status === 401) {
        errorMessage = "로그인이 필요합니다.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // 주문 취소 (사유만 포함)
  const cancelOrder = async () => {
    if (!cancelForm.reason) {
      alert("취소 사유를 선택해주세요.");
      return;
    }

    try {
      setActionLoading(true);

      await API.patch(`/orders/cancel/${showCancelModal}`, {
        reason: cancelForm.reason,
        description: cancelForm.description
      });

      // 주문 목록 다시 조회
      await fetchOrders(pagination.page);

      alert("주문이 취소되었습니다.");
      setShowCancelModal(null);
      setCancelForm({ reason: "", description: "" });
      setError("");
    } catch (err) {
      console.error("주문 취소 오류:", err);
      setError(err.response?.data?.message || "주문 취소에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 반품 신청 (사유 + 이미지 포함)
  const returnOrder = async () => {
    if (!returnForm.reason) {
      alert("반품 사유를 선택해주세요.");
      return;
    }
    if (!returnForm.description.trim()) {
      alert("상세 사유를 입력해주세요.");
      return;
    }

    try {
      setActionLoading(true);

      // FormData 생성
      const formData = new FormData();

      // JSON 데이터를 Blob으로 변환하여 추가
      const requestData = {
        reason: returnForm.reason,
        description: returnForm.description
      };

      formData.append('request', new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      }));

      // 이미지 파일들 추가
      returnForm.images.forEach(imageData => {
        formData.append('images', imageData.file);
      });

      await API.patch(`/orders/return/${showReturnModal}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // 주문 목록 다시 조회
      await fetchOrders(pagination.page);

      alert("반품 신청이 완료되었습니다.");
      setShowReturnModal(null);
      setReturnForm({ reason: "", description: "", images: [] });
      setError("");
    } catch (err) {
      console.error("반품 신청 오류:", err);
      setError(err.response?.data?.message || "반품 신청에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 이미지 업로드 처리 (파일 객체 저장)
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);

    if (files.length === 0) return;

    // 파일 크기 및 타입 검증
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert("이미지 크기는 5MB를 초과할 수 없습니다.");
        return;
      }

      if (!file.type.startsWith('image/')) {
        alert("이미지 파일만 업로드 가능합니다.");
        return;
      }
    }

    if (returnForm.images.length + files.length > 5) {
      alert("이미지는 최대 5장까지 업로드 가능합니다.");
      return;
    }

    // 파일 객체와 미리보기 URL을 함께 저장
    const fileData = files.map(file => ({
      file: file,
      previewUrl: URL.createObjectURL(file)
    }));

    setReturnForm(prev => ({
      ...prev,
      images: [...prev.images, ...fileData]
    }));
  };

  // 이미지 제거 (반품용)
  const removeReturnImage = (index) => {
    setReturnForm(prev => {
      // 미리보기 URL 메모리 해제
      const imageToRemove = prev.images[index];
      if (imageToRemove && imageToRemove.previewUrl) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }

      return {
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      };
    });
  };

  // 상태 필터 변경
  const handleStatusChange = (status) => {
    setSelectedStatus(status);
    fetchOrders(1, status); // 첫 페이지부터 다시 조회
  };

  // 페이지 변경
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPage) {
      fetchOrders(newPage);
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 모달 닫기
  const closeDetailModal = () => {
    setShowDetailModal(null);
    setOrderDetail(null);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading && orders.length === 0) {
    return (
        <div className="mypage_main">
          <MyPageHeader />
          <div className="mypage_contents">
            <div className="loading-container">
              <div className="spinner"></div>
              <p>주문 내역을 불러오는 중...</p>
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
            <h1 className="page-title">📦 주문/배송 내역</h1>
            <p className="page-description">주문한 상품의 배송 상태를 확인하고 취소/반품을 신청하세요</p>
          </div>

          {error && (
              <div className="error-alert">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
          )}

          {/* 상태 필터 */}
          <div className="order-filters">
            <div className="filter-section">
              <h3 className="filter-title">주문 상태</h3>
              <div className="status-filter-buttons">
                {statusOptions.map((option) => (
                    <button
                        key={option.label}
                        className={`filter-btn ${
                            JSON.stringify(selectedStatus) === JSON.stringify(option.value) ? 'active' : ''
                        }`}
                        onClick={() => handleStatusChange(option.value)}
                        disabled={loading}
                    >
                  <span className={`status-badge ${option.color}`}>
                    {option.label}
                  </span>
                    </button>
                ))}
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-icon">📦</div>
                <h3>주문 내역이 없습니다</h3>
                <p>아직 주문하신 상품이 없습니다. 스토어에서 주짓수 용품을 둘러보세요!</p>
                <button
                    className="btn-primary"
                    onClick={() => window.location.href = '/store'}
                >
                  스토어 둘러보기
                </button>
              </div>
          ) : (
              <>
                {/* 주문 목록 */}
                <div className="orders-list">
                  {orders.map((order) => {
                    const payTypeInfo = getPayTypeInfo(order.payType);

                    return (
                        <div key={order.id} className="order-card">
                          {/* 주문 헤더 */}
                          <div className="order-header">
                            <div className="order-info">
                              <h4 className="order-id">주문번호: {order.id}</h4>
                              <p className="order-date">{formatDate(order.createdAt)}</p>
                            </div>
                            <div className="order-status-section">
                            <span className={`status-badge ${getStatusColor(order.orderStatus)}`}>
                              {getStatusLabel(order.orderStatus)}
                            </span>
                            </div>
                          </div>

                          {/* 주문 상품 목록 */}
                          <div className="order-items">
                            {order.orderItems.map((item) => (
                                <div key={item.id} className="order-item">
                                  <div className="item-info">
                                    <h5 className="item-name">{item.itemName}</h5>
                                    <div className="item-options">
                                      {item.itemOption && (
                                          <>
                                            {item.itemOption.size && (
                                                <span className="option-tag size-tag">
                                                📏 사이즈: {item.itemOption.size}
                                              </span>
                                            )}
                                            {item.itemOption.color && (
                                                <span className="option-tag color-tag">
                                                🎨 색상: {item.itemOption.color}
                                              </span>
                                            )}
                                          </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="item-details">
                                    <p className="item-price">₩{item.price.toLocaleString()} × {item.quantity}개</p>
                                    <p className="item-total">₩{item.totalPrice.toLocaleString()}</p>
                                  </div>
                                </div>
                            ))}
                          </div>

                          {/* 주문 요약 */}
                          <div className="order-summary">
                            <div className="summary-info">
                              <div className="summary-row">
                                <span>총 주문금액</span>
                                <span className="total-price">₩{order.totalPrice.toLocaleString()}</span>
                              </div>
                              <div className="summary-row">
                                <span>결제방법</span>
                                <div className={`payment-badge ${payTypeInfo.color}`}>
                                  <span className="payment-icon">{payTypeInfo.icon}</span>
                                  <span className="payment-label">{payTypeInfo.label}</span>
                                </div>
                              </div>
                            </div>

                            {/* 주문 액션 버튼 */}
                            <div className="order-actions">
                              {order.orderStatus === 'WAITING' && (
                                  <button
                                      className="btn-outline cancel-btn"
                                      onClick={() => setShowCancelModal(order.id)}
                                      disabled={actionLoading}
                                  >
                                    주문 취소
                                  </button>
                              )}
                              {order.orderStatus === 'COMPLETE' && (
                                  <button
                                      className="btn-outline return-btn"
                                      onClick={() => setShowReturnModal(order.id)}
                                      disabled={actionLoading}
                                  >
                                    반품 신청
                                  </button>
                              )}
                              <button
                                  className="btn-primary detail-btn"
                                  onClick={() => fetchOrderDetail(order.id)}
                                  disabled={actionLoading}
                              >
                                상세보기
                              </button>
                            </div>
                          </div>
                        </div>
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {pagination.totalPage > 1 && (
                    <div className="pagination">
                      <button
                          className="page-btn"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1 || loading}
                      >
                        이전
                      </button>

                      <div className="page-numbers">
                        {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((page) => (
                            <button
                                key={page}
                                className={`page-number ${page === pagination.page ? 'active' : ''}`}
                                onClick={() => handlePageChange(page)}
                                disabled={loading}
                            >
                              {page}
                            </button>
                        ))}
                      </div>

                      <button
                          className="page-btn"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPage || loading}
                      >
                        다음
                      </button>
                    </div>
                )}
              </>
          )}

          {actionLoading && (
              <div className="loading-overlay">
                <div className="loading-overlay-content">
                  <div className="spinner"></div>
                  <p>처리 중...</p>
                </div>
              </div>
          )}

          {/* 주문 상세 모달 */}
          {showDetailModal && orderDetail && (
              <div className="modern-modal-overlay" onClick={closeDetailModal}>
                <div className="modern-modal-content order-detail-modal" onClick={(e) => e.stopPropagation()}>
                  {/* 모달 헤더 */}
                  <div className="modern-modal-header order-detail-header">
                    <div className="modal-title-section">
                      <div className="modal-icon order-detail-icon">
                        <span>📋</span>
                      </div>
                      <h3 className="modal-title">주문 상세 정보</h3>
                    </div>
                    <button
                        className="modern-modal-close"
                        onClick={closeDetailModal}
                    >
                      ×
                    </button>
                  </div>

                  {/* 모달 바디 */}
                  <div className="modern-modal-body">
                    {/* 주문 기본 정보 */}
                    <div className="order-detail-section">
                      <h4 className="detail-section-title">📦 주문 정보</h4>
                      <div className="detail-info-grid">
                        <div className="detail-info-item">
                          <span className="detail-label">주문번호</span>
                          <span className="detail-value">{orderDetail.id}</span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">주문일시</span>
                          <span className="detail-value">{formatDate(orderDetail.createdAt)}</span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">주문상태</span>
                          <span className={`status-badge ${getStatusColor(orderDetail.orderStatus)}`}>
                            {getStatusLabel(orderDetail.orderStatus)}
                          </span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">결제방법</span>
                          <div className={`payment-badge ${getPayTypeInfo(orderDetail.payType).color}`}>
                            <span className="payment-icon">{getPayTypeInfo(orderDetail.payType).icon}</span>
                            <span className="payment-label">{getPayTypeInfo(orderDetail.payType).label}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 주문 상품 목록 */}
                    <div className="order-detail-section">
                      <h4 className="detail-section-title">🛍️ 주문 상품</h4>
                      <div className="detail-items-list">
                        {orderDetail.orderItems.map((item) => (
                            <div key={item.id} className="detail-order-item">
                              <div className="detail-item-info">
                                <h5 className="detail-item-name">{item.itemName}</h5>
                                <div className="detail-item-options">
                                  {item.itemOption && (
                                      <>
                                        {item.itemOption.size && (
                                            <span className="option-tag size-tag">
                                              📏 사이즈: {item.itemOption.size}
                                            </span>
                                        )}
                                        {item.itemOption.color && (
                                            <span className="option-tag color-tag">
                                              🎨 색상: {item.itemOption.color}
                                            </span>
                                        )}
                                      </>
                                  )}
                                </div>
                              </div>
                              <div className="detail-item-pricing">
                                <div className="detail-item-price">₩{item.price.toLocaleString()} × {item.quantity}개</div>
                                <div className="detail-item-total">₩{item.totalPrice.toLocaleString()}</div>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>

                    {/* 배송 정보 */}
                    <div className="order-detail-section">
                      <h4 className="detail-section-title">🚚 배송 정보</h4>
                      <div className="detail-info-grid">
                        <div className="detail-info-item">
                          <span className="detail-label">받는 분</span>
                          <span className="detail-value">{orderDetail.name}</span>
                        </div>
                        <div className="detail-info-item">
                          <span className="detail-label">연락처</span>
                          <span className="detail-value">{orderDetail.phoneNum}</span>
                        </div>
                        <div className="detail-info-item full-width">
                          <span className="detail-label">배송주소</span>
                          <span className="detail-value">
                            ({orderDetail.zipcode}) {orderDetail.address} {orderDetail.addrDetail}
                          </span>
                        </div>
                        {orderDetail.requirement && (
                            <div className="detail-info-item full-width">
                              <span className="detail-label">배송메모</span>
                              <span className="detail-value">{orderDetail.requirement}</span>
                            </div>
                        )}
                      </div>
                    </div>

                    {/* 결제 정보 */}
                    <div className="order-detail-section">
                      <h4 className="detail-section-title">💰 결제 정보</h4>
                      <div className="payment-summary">
                        <div className="payment-summary-row">
                          <span>상품금액</span>
                          <span>₩{orderDetail.totalPrice.toLocaleString()}</span>
                        </div>
                        <div className="payment-summary-row">
                          <span>배송비</span>
                          <span className="free-shipping">무료</span>
                        </div>
                        <div className="payment-summary-divider"></div>
                        <div className="payment-summary-row total">
                          <span>총 결제금액</span>
                          <span>₩{orderDetail.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 모달 푸터 */}
                  <div className="modern-modal-footer">
                    <button
                        className="modern-btn modern-btn-outline"
                        onClick={closeDetailModal}
                    >
                      닫기
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* 개선된 주문 취소 모달 */}
          {showCancelModal && (
              <div className="modern-modal-overlay" onClick={() => setShowCancelModal(null)}>
                <div className="modern-modal-content cancel-modal" onClick={(e) => e.stopPropagation()}>
                  {/* 모달 헤더 */}
                  <div className="modern-modal-header cancel-header">
                    <div className="modal-title-section">
                      <div className="modal-icon cancel-icon">
                        <span>⚠️</span>
                      </div>
                      <h3 className="modal-title">주문 취소</h3>
                    </div>
                    <button
                        className="modern-modal-close"
                        onClick={() => setShowCancelModal(null)}
                        disabled={actionLoading}
                    >
                      ×
                    </button>
                  </div>

                  {/* 모달 바디 */}
                  <div className="modern-modal-body">
                    <p className="modal-description">
                      주문을 취소하시겠습니까? 취소된 주문은 복구할 수 없습니다.
                    </p>

                    <div className="modern-form-group">
                      <label className="modern-form-label">
                        취소 사유 <span className="required-mark">*</span>
                      </label>
                      <select
                          value={cancelForm.reason}
                          onChange={(e) => setCancelForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="modern-form-select"
                          disabled={actionLoading}
                      >
                        <option value="">사유를 선택해주세요</option>
                        {cancelReasons.map(reason => (
                            <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>

                    <div className="modern-form-group">
                      <label className="modern-form-label">
                        상세 설명 (선택사항)
                      </label>
                      <textarea
                          value={cancelForm.description}
                          onChange={(e) => setCancelForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="취소 사유에 대한 상세한 설명을 입력해주세요"
                          className="modern-form-textarea"
                          rows="3"
                          disabled={actionLoading}
                      />
                    </div>
                  </div>

                  {/* 모달 푸터 */}
                  <div className="modern-modal-footer">
                    <button
                        className="modern-btn modern-btn-outline"
                        onClick={() => setShowCancelModal(null)}
                        disabled={actionLoading}
                    >
                      취소
                    </button>
                    <button
                        className="modern-btn modern-btn-danger"
                        onClick={cancelOrder}
                        disabled={!cancelForm.reason || actionLoading}
                    >
                      {actionLoading && (
                          <div className="btn-spinner"></div>
                      )}
                      {actionLoading ? "처리중..." : "주문 취소"}
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* 개선된 반품 신청 모달 */}
          {showReturnModal && (
              <div className="modern-modal-overlay" onClick={() => setShowReturnModal(null)}>
                <div className="modern-modal-content return-modal" onClick={(e) => e.stopPropagation()}>
                  {/* 모달 헤더 */}
                  <div className="modern-modal-header return-header">
                    <div className="modal-title-section">
                      <div className="modal-icon return-icon">
                        <span>📦</span>
                      </div>
                      <h3 className="modal-title">반품 신청</h3>
                    </div>
                    <button
                        className="modern-modal-close"
                        onClick={() => setShowReturnModal(null)}
                        disabled={actionLoading}
                    >
                      ×
                    </button>
                  </div>

                  {/* 모달 바디 */}
                  <div className="modern-modal-body">
                    <p className="modal-description">
                      상품에 문제가 있으셨나요? 반품 사유와 상세 정보를 입력해주세요.
                    </p>

                    <div className="modern-form-group">
                      <label className="modern-form-label">
                        반품 사유 <span className="required-mark">*</span>
                      </label>
                      <select
                          value={returnForm.reason}
                          onChange={(e) => setReturnForm(prev => ({ ...prev, reason: e.target.value }))}
                          className="modern-form-select"
                          disabled={actionLoading}
                      >
                        <option value="">사유를 선택해주세요</option>
                        {returnReasons.map(reason => (
                            <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>

                    <div className="modern-form-group">
                      <label className="modern-form-label">
                        상세 설명 <span className="required-mark">*</span>
                      </label>
                      <textarea
                          value={returnForm.description}
                          onChange={(e) => setReturnForm(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="반품 사유에 대한 상세한 설명을 입력해주세요"
                          className="modern-form-textarea"
                          rows="4"
                          disabled={actionLoading}
                      />
                    </div>

                    <div className="modern-form-group">
                      <label className="modern-form-label">
                        증빙 사진 (권장)
                      </label>
                      <div className="modern-file-upload">
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="modern-file-input"
                            id="return-images"
                            disabled={actionLoading}
                        />
                        <label htmlFor="return-images" className="modern-file-label">
                          <div className="file-upload-content">
                            <div className="file-upload-icon">📷</div>
                            <span className="file-upload-text">
                              사진을 클릭하여 추가하세요
                            </span>
                            <span className="file-upload-help">
                              (최대 5장, 각 5MB 이하)
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* 이미지 미리보기 */}
                      {returnForm.images && returnForm.images.length > 0 && (
                          <div className="image-preview-grid">
                            {returnForm.images.map((imageData, index) => (
                                <div key={index} className="image-preview-item">
                                  <img
                                      src={imageData.previewUrl}
                                      alt={`증빙사진 ${index + 1}`}
                                      className="preview-image"
                                  />
                                  <button
                                      type="button"
                                      onClick={() => removeReturnImage(index)}
                                      className="remove-image-btn"
                                      disabled={actionLoading}
                                  >
                                    ×
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                  </div>

                  {/* 모달 푸터 */}
                  <div className="modern-modal-footer">
                    <button
                        className="modern-btn modern-btn-outline"
                        onClick={() => setShowReturnModal(null)}
                        disabled={actionLoading}
                    >
                      취소
                    </button>
                    <button
                        className="modern-btn modern-btn-warning"
                        onClick={returnOrder}
                        disabled={!returnForm.reason || !returnForm.description.trim() || actionLoading}
                    >
                      {actionLoading && (
                          <div className="btn-spinner"></div>
                      )}
                      {actionLoading ? "처리중..." : "반품 신청"}
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </div>
  );
};

export default MyPageOrders;