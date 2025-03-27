import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import '../styles/StoreDetail.css';

const StoreDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('description');
  
  // 상품 정보 가져오기
  const fetchItemDetail = useCallback(async () => {
    try {
      setLoading(true);
      console.log(`상품 상세 정보 요청: /api/items/${itemId}`);
      
      const response = await API.get(`/api/items/${itemId}`);
      console.log('상품 상세 응답:', response);
      
      if (response.status === 200) {
        setItem(response.data);
      } else {
        throw new Error('상품 정보를 가져오는 데 실패했습니다.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('상품 상세 정보 로딩 실패:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다');
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    fetchItemDetail();
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
  }, [fetchItemDetail]);

  // 할인율 계산
  const calculateDiscountRate = (price, sale) => {
    if (!price || price === 0) return 0;
    return Math.round(((price - (sale || 0)) / price) * 100);
  };

  // 가격 포맷
  const formatPrice = (price) => {
    if (!price && price !== 0) return '0원';
    return price.toLocaleString('ko-KR') + '원';
  };

  // 총 가격 계산
  const calculateTotalPrice = () => {
    if (!item) return 0;
    const unitPrice = item.sale > 0 ? item.sale : item.price;
    return unitPrice * quantity;
  };

  // 수량 증가
  const increaseQuantity = () => {
    if (item && quantity < item.amount) {
      setQuantity(prev => prev + 1);
    }
  };

  // 수량 감소
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  // 장바구니에 추가
  const addToCart = () => {
    // 로그인 체크 및 장바구니 추가 로직 구현 필요
    alert(`장바구니에 ${item.name} ${quantity}개가 추가되었습니다.`);
  };

  // 바로 구매하기
  const buyNow = () => {
    // 로그인 체크 및 결제 페이지로 이동 필요
    alert('구매 페이지로 이동합니다.');
    // navigate('/checkout', { state: { items: [{ id: item.id, quantity }] } });
  };

  // 이미지 변경
  const changeImage = (index) => {
    setActiveImageIndex(index);
  };

  // 탭 변경
  const changeTab = (tab) => {
    setActiveTab(tab);
  };

  // 별점 렌더링
  const renderStars = (rating) => {
    return (
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span 
            key={star} 
            className={`star ${star <= rating ? 'filled' : ''}`}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // 리뷰 평균 별점 계산
  const calculateAverageRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => {
      return total + (review.star || 0);
    }, 0);
    return (sum / reviews.length).toFixed(1);
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) return <div className="loading">상품 정보를 불러오는 중...</div>;
  if (error) return <div className="error">오류: {error}</div>;
  if (!item) return <div className="not-found">상품을 찾을 수 없습니다.</div>;

  const discountRate = calculateDiscountRate(item.price, item.sale);
  const averageRating = calculateAverageRating(item.reviews);
  const hasReviews = item.reviews && item.reviews.length > 0;
  const hasImages = item.images && item.images.length > 0;
  const currentImage = hasImages ? item.images[activeImageIndex] : '/images/blank_img.png';

  return (
    <div className="store-detail">
      <div className="detail-container">
        <div className="detail-top">
          <div className="detail-image-section">
            <div className="main-image-container">
              <img 
                src={currentImage} 
                alt={item.name} 
                className="main-image" 
              />
              {item.sale > 0 && (
                <span className="discount-badge">
                  {discountRate}%
                </span>
              )}
              {item.amount <= 0 && (
                <div className="sold-out-overlay">
                  <span>SOLD OUT</span>
                </div>
              )}
            </div>
            
            {hasImages && item.images.length > 1 && (
              <div className="thumbnail-container">
                {item.images.map((image, index) => (
                  <div 
                    key={index}
                    className={`thumbnail ${index === activeImageIndex ? 'active' : ''}`}
                    onClick={() => changeImage(index)}
                  >
                    <img src={image} alt={`${item.name} 썸네일 ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="detail-info-section">
            <h1 className="item-name">{item.name}</h1>
            
            <div className="item-rating-info">
              {renderStars(averageRating)}
              <span className="average-rating">{averageRating}</span>
              <span className="review-count">({item.reviews ? item.reviews.length : 0}개 리뷰)</span>
            </div>
            
            {item.size && <p className="item-size">사이즈: {item.size}</p>}
            
            <div className="item-price-info">
              {item.sale > 0 ? (
                <>
                  <div className="price-row">
                    <span className="price-label">정가</span>
                    <span className="original-price">{formatPrice(item.price)}</span>
                  </div>
                  <div className="price-row">
                    <span className="price-label">판매가</span>
                    <span className="sale-price">{formatPrice(item.sale)}</span>
                    <span className="discount-rate">{discountRate}% 할인</span>
                  </div>
                </>
              ) : (
                <div className="price-row">
                  <span className="price-label">판매가</span>
                  <span className="item-price">{formatPrice(item.price)}</span>
                </div>
              )}
            </div>
            
            <div className="item-quantity">
              <span className="quantity-label">수량</span>
              <div className="quantity-control">
                <button 
                  className="quantity-btn minus" 
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="quantity-value">{quantity}</span>
                <button 
                  className="quantity-btn plus" 
                  onClick={increaseQuantity}
                  disabled={item.amount <= 0 || quantity >= item.amount}
                >
                  +
                </button>
              </div>
              <span className="stock-info">
                {item.amount > 0 ? `재고: ${item.amount}개` : '품절'}
              </span>
            </div>
            
            <div className="total-price-section">
              <span className="total-price-label">총 상품 금액</span>
              <span className="total-price-value">{formatPrice(calculateTotalPrice())}</span>
            </div>
            
            <div className="action-buttons">
              <button 
                className="add-to-cart-btn"
                onClick={addToCart}
                disabled={item.amount <= 0}
              >
                장바구니
              </button>
              <button 
                className="buy-now-btn"
                onClick={buyNow}
                disabled={item.amount <= 0}
              >
                바로 구매하기
              </button>
            </div>
          </div>
        </div>
        
        <div className="detail-tabs">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => changeTab('description')}
          >
            상품설명
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => changeTab('reviews')}
          >
            리뷰 ({item.reviews ? item.reviews.length : 0})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'delivery' ? 'active' : ''}`}
            onClick={() => changeTab('delivery')}
          >
            배송/환불 안내
          </button>
        </div>
        
        <div className="tab-content">
          {activeTab === 'description' && (
            <div className="description-tab">
              <div className="item-description">
                {item.content ? (
                  <p>{item.content}</p>
                ) : (
                  <p className="no-description">상품 설명이 없습니다.</p>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              <div className="review-summary">
                <div className="average-rating-display">
                  <div className="rating-number">{averageRating}</div>
                  <div className="rating-stars">{renderStars(averageRating)}</div>
                </div>
                <div className="review-count-display">
                  총 <span className="highlight">{item.reviews ? item.reviews.length : 0}</span>개의 리뷰가 있습니다.
                </div>
              </div>
              
              {hasReviews ? (
                <div className="review-list">
                  {item.reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <span className="reviewer-name">{review.name}</span>
                          <span className="review-date">{formatDate(review.createdAt)}</span>
                        </div>
                        <div className="review-rating">{renderStars(review.star)}</div>
                      </div>
                      
                      {review.images && review.images.length > 0 && (
                        <div className="review-images">
                          {review.images.map((image, index) => (
                            <img 
                              key={index} 
                              src={image} 
                              alt={`리뷰 이미지 ${index + 1}`} 
                              className="review-image" 
                            />
                          ))}
                        </div>
                      )}
                      
                      <div className="review-content">{review.content}</div>
                      
                      {review.depth === 0 && (
                        <div className="reply-section">
                          {item.reviews.filter(r => r.parentId === review.id).map((reply) => (
                            <div key={reply.id} className="reply-item">
                              <div className="reply-header">
                                <span className="reply-badge">답변</span>
                                <span className="reply-name">{reply.name}</span>
                                <span className="reply-date">{formatDate(reply.createdAt)}</span>
                              </div>
                              <div className="reply-content">{reply.content}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-reviews">
                  <p>아직 리뷰가 없습니다. 첫 리뷰를 작성해보세요!</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'delivery' && (
            <div className="delivery-tab">
              <div className="delivery-info">
                <h3>배송 정보</h3>
                <ul>
                  <li>배송 방법: 택배</li>
                  <li>배송 지역: 전국</li>
                  <li>배송 비용: 무료</li>
                  <li>배송 기간: 2~3일 이내 도착 예정</li>
                </ul>
              </div>
              
              <div className="refund-info">
                <h3>환불 및 교환 정보</h3>
                <ul>
                  <li>교환/반품 신청 기간: 상품 수령 후 7일 이내</li>
                  <li>교환/반품 배송비: 구매자 부담</li>
                  <li>교환/반품 불가 사유: 고객의 책임 있는 사유로 상품이 훼손된 경우</li>
                  <li>소비자 피해보상 문의: 고객센터 (1234-5678)</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreDetail;
