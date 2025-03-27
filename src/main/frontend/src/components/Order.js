import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import API from '../utils/api';
import '../styles/Order.css';

const Order = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {id} = useParams(); // 주문 상세페이지를 위한 ID
  const isNewOrder = location.pathname === '/order/new';
  
  // 기존 주문 목록 상태
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [pageSize] = useState(10);
  
  // 새 주문 관련 상태
  const [orderItems, setOrderItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [orderForm, setOrderForm] = useState({
    name: '',
    address: '',
    zipcode: '',
    addrDetail: '',
    phoneNum: '',
    requirement: '',
    payType: 'CARD'
  });
  
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
  
  // 새 주문 정보 불러오기
  useEffect(() => {
    if (isNewOrder) {
      // localStorage에서 임시 주문 정보 가져오기
      const storedItems = localStorage.getItem('tempOrderItems');
      const storedTotalPrice = localStorage.getItem('tempOrderTotalPrice');
      
      if (storedItems) {
        setOrderItems(JSON.parse(storedItems));
        setTotalPrice(storedTotalPrice ? parseFloat(storedTotalPrice) : 0);
        setLoading(false);
      } else {
        // 주문 정보가 없으면 장바구니 페이지로 리다이렉트
        alert('주문할 상품 정보가 없습니다.');
        navigate('/cart');
      }
      
      // 사용자 정보 가져와서 폼 초기화 (로그인된 경우)
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          // 사용자 정보 API 호출 예시
          API.get(`/users/${userId}`).then(response => {
            if (response.status === 200 && response.data) {
              setOrderForm(prev => ({
                ...prev,
                name: response.data.name || '',
                phoneNum: response.data.phoneNum || '',
                address: response.data.address || '',
                zipcode: response.data.zipcode || '',
                addrDetail: response.data.addrDetail || ''
              }));
            }
          });
        } catch (err) {
          console.error('사용자 정보 로딩 실패:', err);
        }
      }
    }
  }, [isNewOrder, navigate]);

  // 주문 목록 가져오기
  const fetchOrders = useCallback(async (page) => {
    if (isNewOrder) return; // 새 주문 페이지에서는 목록을 가져오지 않음
    
    try {
      setLoading(true);
      // 로컬 스토리지에서 사용자 ID 가져오기
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
  }, [pageSize, isNewOrder]);

  useEffect(() => {
    if (!isNewOrder) {
      fetchOrders(currentPage);
    }
  }, [currentPage, fetchOrders, isNewOrder]);

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
  
  // 가격 포맷 함수
  const formatPrice = (price) => {
    if (!price && price !== 0) return '0원';
    return price.toLocaleString('ko-KR') + '원';
  };
  
  // 폼 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 주문 제출 핸들러
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    if (!orderForm.name || !orderForm.address || !orderForm.zipcode || !orderForm.phoneNum) {
      alert('필수 정보를 모두 입력해주세요.');
      return;
    }
    
    try {
      setLoading(true);
      const userId = localStorage.getItem('userId') || 1;
      
      // 주문 API 요청 데이터 준비
      const orderData = {
        name: orderForm.name,
        address: orderForm.address,
        zipcode: orderForm.zipcode,
        addrDetail: orderForm.addrDetail,
        phoneNum: orderForm.phoneNum,
        requirement: orderForm.requirement,
        totalPrice: totalPrice,
        totalCount: orderItems.reduce((sum, item) => sum + item.quantity, 0),
        payType: orderForm.payType,
        userId: parseInt(userId),
        cartItems: orderItems.map(item => ({
          itemId: item.id,
          itemName: item.name,
          price: item.originalPrice || item.price,
          currentPrice: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        }))
      };
      
      // 주문 생성 API 요청
      const response = await API.post('/orders', orderData);
      
      if (response.status === 200 || response.status === 201) {
        alert('주문이 성공적으로 완료되었습니다.');
        
        // 주문 완료 후 임시 데이터 삭제
        localStorage.removeItem('tempOrderItems');
        localStorage.removeItem('tempOrderTotalPrice');
        
        // 장바구니에서 주문한 경우 장바구니에서 상품 제거
        if (location.state?.fromCart) {
          const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
          const updatedCart = cartItems.filter(item => 
            !orderItems.some(orderItem => orderItem.id === item.id)
          );
          localStorage.setItem('cart', JSON.stringify(updatedCart));
        }
        
        // 주문 목록 페이지로 이동
        navigate('/order');
      } else {
        throw new Error('주문 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('주문 제출 오류:', error);
      alert(`주문 처리 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 페이지 번호 배열 생성
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  if (loading) {
    return <div className="loading-container">
      {isNewOrder ? '주문 정보를 처리하는 중...' : '주문 내역을 불러오는 중...'}
    </div>;
  }

  if (error && !isNewOrder) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="retry-button" onClick={() => fetchOrders(currentPage)}>
          다시 시도
        </button>
      </div>
    );
  }
  
  // 새 주문 생성 페이지 렌더링
  if (isNewOrder) {
    return (
      <div className="order-container new-order">
        <h1 className="order-title">주문하기</h1>
        
        <div className="order-form-container">
          <div className="order-items-summary">
            <h3>주문 상품 ({orderItems.length}개)</h3>
            {orderItems.map(item => (
              <div key={item.id} className="order-item-row">
                <div className="item-image">
                  <img 
                    src={item.image || '/images/blank_img.png'} 
                    alt={item.name}
                    onError={(e) => { e.target.src = '/images/blank_img.png' }}
                  />
                </div>
                <div className="item-details">
                  <div className="item-name">{item.name}</div>
                  <div className="item-price-quantity">
                    <span>{formatPrice(item.price)} x {item.quantity}개</span>
                  </div>
                </div>
                <div className="item-total">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
            
            <div className="order-price-summary">
              <div className="price-row">
                <span>상품 금액</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>
              <div className="price-row">
                <span>배송비</span>
                <span>{totalPrice > 50000 ? '무료' : formatPrice(3000)}</span>
              </div>
              <div className="price-row total">
                <span>총 결제 금액</span>
                <span>{formatPrice(totalPrice > 50000 ? totalPrice : totalPrice + 3000)}</span>
              </div>
            </div>
          </div>
          
          <form className="order-form" onSubmit={handleSubmitOrder}>
            <div className="form-section">
              <h3>배송 정보</h3>
              
              <div className="form-group">
                <label htmlFor="name">받는 사람 *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={orderForm.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="zipcode">우편번호 *</label>
                <div className="zipcode-input">
                  <input
                    type="text"
                    id="zipcode"
                    name="zipcode"
                    value={orderForm.zipcode}
                    onChange={handleInputChange}
                    required
                    readOnly
                  />
                  <button 
                    type="button" 
                    className="find-address-btn"
                    onClick={() => {
                      // 주소 검색 API 연동 (예: 다음 우편번호 검색)
                      alert('주소 검색 기능이 연동되어야 합니다.');
                    }}
                  >
                    주소 찾기
                  </button>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">주소 *</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={orderForm.address}
                  onChange={handleInputChange}
                  required
                  readOnly
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="addrDetail">상세주소</label>
                <input
                  type="text"
                  id="addrDetail"
                  name="addrDetail"
                  value={orderForm.addrDetail}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phoneNum">연락처 *</label>
                <input
                  type="tel"
                  id="phoneNum"
                  name="phoneNum"
                  placeholder="010-0000-0000"
                  value={orderForm.phoneNum}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="requirement">배송 요청사항</label>
                <textarea
                  id="requirement"
                  name="requirement"
                  rows="3"
                  value={orderForm.requirement}
                  onChange={handleInputChange}
                  placeholder="배송 시 요청사항을 입력해주세요."
                ></textarea>
              </div>
            </div>
            
            <div className="form-section">
              <h3>결제 방법</h3>
              
              <div className="payment-methods">
                {Object.entries(payTypeMap).map(([key, value]) => (
                  <div className="payment-method" key={key}>
                    <input
                      type="radio"
                      id={`payment-${key}`}
                      name="payType"
                      value={key}
                      checked={orderForm.payType === key}
                      onChange={handleInputChange}
                    />
                    <label htmlFor={`payment-${key}`}>{value}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="order-actions">
              <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>
                취소
              </button>
              <button type="submit" className="submit-order-btn">
                {formatPrice(totalPrice > 50000 ? totalPrice : totalPrice + 3000)} 결제하기
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // 주문 목록 페이지 렌더링 (기존 코드와 동일)
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
