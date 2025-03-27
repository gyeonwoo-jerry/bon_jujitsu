import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import '../styles/StoreItemList.css';

const StoreItemList = () => {
  const [storeData, setStoreData] = useState({
    data: [],
    totalPage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // 1부터 시작하는 페이지 번호
  const [pageSize] = useState(10);

  // useCallback을 사용하여 fetchStoreItems 함수 메모이제이션
  const fetchStoreItems = useCallback(async (page) => {
    try {
      setLoading(true);
      console.log(`상품 데이터 요청: /api/items?page=${page}&size=${pageSize}`);
      
      const response = await API.get(`/api/items?page=${page}&size=${pageSize}`);
      console.log('API 응답:', response);
      
      if (response.status === 200) {
        console.log('응답 데이터:', response.data);
        // BoardList.js와 동일한 방식으로 데이터 처리
        const items = Array.isArray(response.data.data) ? response.data.data : [];
        const totalPages = response.data.totalPage || 0;
        
        console.log('처리된 상품 목록:', items);
        console.log('전체 페이지 수:', totalPages);
        
        setStoreData({
          data: items,
          totalPage: totalPages
        });
      } else {
        throw new Error('상품 데이터를 가져오는 데 실패했습니다.');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('상품 데이터 불러오기 실패:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다');
      setStoreData({ 
        data: [], 
        totalPage: 0 
      });
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchStoreItems(currentPage);
  }, [currentPage, fetchStoreItems]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // 페이지 상단으로 스크롤
  };

  const calculateDiscountRate = (price, sale) => {
    if (!price || price === 0) return 0;
    return Math.round(((price - (sale || 0)) / price) * 100);
  };

  const formatPrice = (price) => {
    if (!price && price !== 0) return '0원';
    return price.toLocaleString('ko-KR') + '원';
  };

  // 리뷰 평균 별점 계산 - 안전하게 처리
  const calculateAverageRating = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const sum = reviews.reduce((total, review) => {
      const star = review && typeof review.star === 'number' ? review.star : 0;
      return total + star;
    }, 0);
    return (sum / reviews.length).toFixed(1);
  };

  // 데이터 로드 중일 때 로딩 표시
  if (loading) return <div className="loading">상품 정보를 불러오는 중...</div>;
  if (error) return <div className="error">오류: {error}</div>;

  // 페이지네이션 버튼 생성 - BoardList.js 방식으로 통일
  const pageNumbers = [];
  for (let i = 1; i <= storeData.totalPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="store-container">
      <div className='inner'>
        <h1 className="section_title">스토어</h1>
        
        <div className="store-filters">
            <div className="filter-options">
            <button className="filter-btn active">전체</button>
            <button className="filter-btn">의류</button>
            <button className="filter-btn">용품</button>
            <button className="filter-btn">악세서리</button>
            </div>
            <select className="sort-select">
            <option value="newest">최신순</option>
            <option value="price-low">가격 낮은순</option>
            <option value="price-high">가격 높은순</option>
            <option value="rating">평점 높은순</option>
            </select>
        </div>

        {storeData.data.length > 0 ? (
            <div className="item-grid">
            {storeData.data.map((item, index) => (
                <div key={item?.id || index} className="item-card">
                <Link to={`/store/items/${item?.id || index}`} className="item-link">
                    <div className="item-image-container">
                    <img 
                        src={item?.images && Array.isArray(item.images) && item.images.length > 0 
                        ? item.images[0] 
                        : '/images/blank_img.png'} 
                        alt={item?.name || '상품'} 
                        className="item-image" 
                    />
                    {item?.sale > 0 && (
                        <span className="discount-badge">
                        {calculateDiscountRate(item.price, item.sale)}%
                        </span>
                    )}
                    {(item?.amount <= 0) && (
                        <div className="sold-out-overlay">
                        <span>SOLD OUT</span>
                        </div>
                    )}
                    </div>
                    <div className="item-info">
                    <h3 className="item-name">{item?.name || '상품명 없음'}</h3>
                    <p className="item-size">{item?.size || ''}</p>
                    <div className="item-price-container">
                        {item?.sale > 0 ? (
                        <>
                            <span className="original-price">{formatPrice(item.price)}</span>
                            <span className="sale-price">{formatPrice(item.sale)}</span>
                        </>
                        ) : (
                        <span className="item-price">{formatPrice(item?.price)}</span>
                        )}
                    </div>
                    <div className="item-rating">
                        <div className="stars">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span 
                            key={star} 
                            className={`star ${star <= calculateAverageRating(item?.reviews) ? 'filled' : ''}`}
                            >
                            ★
                            </span>
                        ))}
                        </div>
                        <span className="review-count">
                        ({item?.reviews && Array.isArray(item.reviews) ? item.reviews.length : 0})
                        </span>
                    </div>
                    </div>
                </Link>
                <button 
                    className={`add-to-cart-btn ${(item?.amount <= 0) ? 'disabled' : ''}`}
                    disabled={item?.amount <= 0}
                >
                    {(item?.amount <= 0) ? '품절' : '장바구니 담기'}
                </button>
                </div>
            ))}
            </div>
        ) : (
            <div className="no-items">
            <p>상품이 없습니다.</p>
            </div>
        )}

        {storeData.totalPage > 1 && (
            <div className="pagination">
            <button 
                className="pagination-button"
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                이전
            </button>
            
            {pageNumbers.map(number => (
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
                onClick={() => handlePageChange(Math.min(storeData.totalPage, currentPage + 1))}
                disabled={currentPage === storeData.totalPage}
            >
                다음
            </button>
            </div>
        )}
        </div>
    </div>
  );
};

export default StoreItemList;

