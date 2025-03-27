import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import '../styles/Order.css';

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  const navigate = useNavigate();

  // 주문 상태에 따른 라벨과 스타일 매핑
  const orderStatusMap = {
    'WAITING': { label: '대기중', className: 'status-waiting' },
    'PROCESSING': { label: '처리중', className: 'status-processing' },
    'SHIPPING': { label: '배송중', className: 'status-shipping' },
    'COMPLETED': { label: '배송완료', className: 'status-completed' },
    'CANCELED': { label: '취소됨', className: 'status-canceled' }
  };

  // 결제 방법 매핑
  const payTypeMap = {
    'CARD': '카드결제',
    'CASH': '현금결제',
    'TRANSFER': '계좌이체',
    'MOBILE': '모바일결제'
  };

  // 주문 목록 가져오기
  const fetchOrders = useCallback(async (page) => {
    try {
      setLoading(true);
      // 로컬 스토리지에서 사용자 ID 가져오기 (실제 구현에 맞게 수정 필요)
      const userId = localStorage.getItem('userId') || 1;
      
      const response = await API.get(`/orders?page=${page}&size=${pageSize}&id=${userId}`);
      
      if (response.status === 200) {
        console.log('주문 목록:', response.data);
        setOrders(response.data.data || []);
        setTotalPages(response.data.totalPage || 0);
      } else {
        throw new Error('주문 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('주문 목록 불러오기 오류:', err);
      setError('주문 내역을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage, fetchOrders]);

  // 페이지 변경 핸들러
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 주문 상세 페이지로 이동
  const handleOrderDetail = (orderId) => {
    navigate(`/order/${orderId}`);
  };

  // 날짜 형식 변환 함수
  const formatDate = (dateString) => {
    if (!dateString) return '날짜 정보 없음';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 페이지 번호 배열 생성
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <div className="loading-container">주문 내역을 불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={() => fetchOrders(currentPage)}>
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="order-container">
      <h1 className="order-title">주문 내역</h1>
      
      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">🛒</div>
          <p className="empty-orders-message">주문 내역이 없습니다.</p>
          <button className="shop-now-button" onClick={() => navigate('/store')}>
            지금 쇼핑하기
          </button>
        </div>
      ) : (
        <>
          <div className="order-list">
            {orders.map((order) => (
              <div key={order.id} className="order-item" onClick={() => handleOrderDetail(order.id)}>
                <div className="order-header">
                  <div className="order-date">
                    주문일자: {formatDate(order.createdAt)}
                  </div>
                  <div className={`order-status ${orderStatusMap[order.orderStatus]?.className || ''}`}>
                    {orderStatusMap[order.orderStatus]?.label || order.orderStatus}
                  </div>
                </div>
                
                <div className="order-info">
                  <div className="order-details">
                    <div className="order-number">주문번호: {order.id}</div>
                    <div className="order-payment">결제방법: {payTypeMap[order.payType] || order.payType}</div>
                    <div className="order-amount">결제금액: {order.totalPrice.toLocaleString()}원</div>
                    <div className="order-items-count">상품 개수: {order.totalCount}개</div>
                  </div>
                  
                  <div className="order-items-preview">
                    {Array.isArray(order.cartItems) && order.cartItems.length > 0 ? (
                      <div className="items-list">
                        {order.cartItems.slice(0, 2).map((item) => (
                          <div key={item.id} className="order-item-preview">
                            <div className="item-name">{item.itemName}</div>
                            <div className="item-quantity">x{item.quantity}</div>
                            <div className="item-price">{item.totalPrice.toLocaleString()}원</div>
                          </div>
                        ))}
                        {order.cartItems.length > 2 && (
                          <div className="more-items">
                            외 {order.cartItems.length - 2}개 상품 더보기...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="no-items-data">상품 정보가 없습니다.</div>
                    )}
                  </div>
                </div>
                
                <div className="delivery-info">
                  <div className="delivery-address">
                    <div className="address-label">배송지:</div>
                    <div className="address-value">
                      ({order.zipcode}) {order.address} {order.addrDetail || ''}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="pagination-button" 
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                이전
              </button>
              
              {pageNumbers.map((number) => (
                <button
                  key={number}
                  className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                  onClick={() => handlePageChange(number)}
                >
                  {number}
                </button>
              ))}
              
              <button 
                className="pagination-button" 
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Order;
