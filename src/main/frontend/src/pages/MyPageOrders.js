// pages/MyPageOrders.js
import React, { useEffect, useState } from "react";
import MyPageHeader from "../components/MyPageHeader";
import API from "../utils/api";
import "../styles/mypage.css";

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

  // 결제 방법 한글 표시
  const getPayTypeLabel = (payType) => {
    const payTypeMap = {
      CARD: "카드결제",
      CASH: "현금결제",
      BANK_TRANSFER: "계좌이체"
    };
    return payTypeMap[payType] || payType;
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

  // 주문 취소
  const cancelOrder = async (orderId) => {
    if (!window.confirm("정말로 주문을 취소하시겠습니까?")) {
      return;
    }

    try {
      setActionLoading(true);

      await API.patch(`/orders/cancel/${orderId}`);

      // 주문 목록 다시 조회
      await fetchOrders(pagination.page);

      alert("주문이 취소되었습니다.");
      setError("");
    } catch (err) {
      console.error("주문 취소 오류:", err);
      setError(err.response?.data?.message || "주문 취소에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
  };

  // 반품 신청
  const returnOrder = async (orderId) => {
    if (!window.confirm("반품을 신청하시겠습니까?")) {
      return;
    }

    try {
      setActionLoading(true);

      await API.patch(`/orders/return/${orderId}`);

      // 주문 목록 다시 조회
      await fetchOrders(pagination.page);

      alert("반품 신청이 완료되었습니다.");
      setError("");
    } catch (err) {
      console.error("반품 신청 오류:", err);
      setError(err.response?.data?.message || "반품 신청에 실패했습니다.");
    } finally {
      setActionLoading(false);
    }
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
            <p className="page-description">주문한 상품의 배송 상태를 확인하고 관리하세요</p>
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
                  {orders.map((order) => (
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
                              <span>{getPayTypeLabel(order.payType)}</span>
                            </div>
                            <div className="summary-row">
                              <span>배송지</span>
                              <span>{order.address} {order.addrDetail}</span>
                            </div>
                          </div>

                          {/* 주문 액션 버튼 */}
                          <div className="order-actions">
                            {order.orderStatus === 'WAITING' && (
                                <button
                                    className="btn-outline cancel-btn"
                                    onClick={() => cancelOrder(order.id)}
                                    disabled={actionLoading}
                                >
                                  주문 취소
                                </button>
                            )}
                            {order.orderStatus === 'COMPLETE' && (
                                <button
                                    className="btn-outline return-btn"
                                    onClick={() => returnOrder(order.id)}
                                    disabled={actionLoading}
                                >
                                  반품 신청
                                </button>
                            )}
                            <button
                                className="btn-primary detail-btn"
                                onClick={() => window.location.href = `/orders/${order.id}`}
                            >
                              상세보기
                            </button>
                          </div>
                        </div>
                      </div>
                  ))}
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
                <div className="spinner"></div>
              </div>
          )}
        </div>
      </div>
  );
};

export default MyPageOrders;