import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import '../styles/StoreItemList.css';

const StoreItemList = () => {
  const navigate = useNavigate();
  const [storeData, setStoreData] = useState({
    data: [],
    totalPage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // 1부터 시작하는 페이지 번호
  const [pageSize] = useState(10);
  
  // 필터링 및 정렬을 위한 상태 추가
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortOption, setSortOption] = useState('newest');
  const [filteredItems, setFilteredItems] = useState([]);

  // useCallback을 사용하여 fetchStoreItems 함수 메모이제이션
  const fetchStoreItems = useCallback(async (page) => {
    try {
      setLoading(true);
      console.log(`상품 데이터 요청: /items?page=${page}&size=${pageSize}`);
      
      const response = await API.get(`/items?page=${page}&size=${pageSize}`);
      console.log('API 응답:', response);
      
      if (response.status === 200) {
        console.log('응답 데이터:', response.data);
        const items = Array.isArray(response.data.data) ? response.data.data : [];
        const totalPages = response.data.totalPage || 0;
        
        console.log('처리된 상품 목록:', items);
        console.log('전체 페이지 수:', totalPages);
        
        setStoreData({
          data: items,
          totalPage: totalPages
        });
        
        // 초기 필터링 및 정렬 적용
        applyFiltersAndSort(items, activeCategory, sortOption);
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
      setFilteredItems([]);
      setLoading(false);
    }
  }, [pageSize, activeCategory, sortOption]);

  useEffect(() => {
    fetchStoreItems(currentPage);
  }, [currentPage, fetchStoreItems]);

  // 필터링 및 정렬이 변경될 때마다 상품 목록 업데이트
  useEffect(() => {
    if (storeData.data.length > 0) {
      applyFiltersAndSort(storeData.data, activeCategory, sortOption);
    }
  }, [activeCategory, sortOption, storeData.data]);

  // 필터링 및 정렬을 적용하는 함수
  const applyFiltersAndSort = (items, category, sort) => {
    console.log(`필터 적용: 카테고리=${category}, 정렬=${sort}`);
    
    // 카테고리 필터링
    let filtered = [...items];
    if (category !== 'all') {
      filtered = filtered.filter(item => {
        // 여기서는 item에 카테고리 정보가 있다고 가정합니다.
        // 실제 데이터 구조에 맞게 수정해야 합니다.
        const itemCategory = getCategoryFromItem(item);
        return itemCategory === category;
      });
    }
    
    // 정렬 적용
    filtered.sort((a, b) => {
      switch (sort) {
        case 'price-low':
          return (a.sale || a.price) - (b.sale || b.price);
        case 'price-high':
          return (b.sale || b.price) - (a.sale || a.price);
        case 'rating':
          return calculateAverageRating(b.reviews) - calculateAverageRating(a.reviews);
        case 'newest':
        default:
          // 날짜가 있다면 최신순으로 정렬
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });
    
    setFilteredItems(filtered);
  };

  // 아이템에서 카테고리 정보 추출 (실제 데이터 구조에 맞게 수정 필요)
  const getCategoryFromItem = (item) => {
    // 예시: 상품명이나 설명에 카테고리 키워드가 포함되어 있는지로 판단
    const name = (item.name || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    
    if (name.includes('의류') || content.includes('의류') || 
        name.includes('옷') || content.includes('옷') ||
        name.includes('티셔츠') || content.includes('티셔츠')) {
      return 'clothing';
    } else if (name.includes('용품') || content.includes('용품') ||
               name.includes('도구') || content.includes('도구')) {
      return 'supplies';
    } else if (name.includes('악세서리') || content.includes('악세서리') ||
               name.includes('액세서리') || content.includes('액세서리')) {
      return 'accessories';
    }
    
    // 기본값
    return 'all';
  };

  // 필터 버튼 클릭 핸들러
  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // 페이지를 첫 페이지로 리셋
    setCurrentPage(1);
  };

  // 정렬 옵션 변경 핸들러
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

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

  // 상품 카드 클릭 핸들러
  const handleItemClick = (itemId) => {
    navigate(`/store/items/${itemId}`);
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
        <div className="section_title">스토어</div>
        
        <div className="store-filters">
            <div className="filter-options">
                <button 
                  className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('all')}
                >
                  전체
                </button>
                <button 
                  className={`filter-btn ${activeCategory === 'clothing' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('clothing')}
                >
                  의류
                </button>
                <button 
                  className={`filter-btn ${activeCategory === 'supplies' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('supplies')}
                >
                  용품
                </button>
                <button 
                  className={`filter-btn ${activeCategory === 'accessories' ? 'active' : ''}`}
                  onClick={() => handleCategoryChange('accessories')}
                >
                  악세서리
                </button>
            </div>
            <select 
              className="sort-select"
              value={sortOption}
              onChange={handleSortChange}
            >
                <option value="newest">최신순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
                <option value="rating">평점 높은순</option>
            </select>
        </div>

        {filteredItems.length > 0 ? (
            <div className="item-grid">
            {filteredItems.map((item, index) => (
                <div 
                  key={item?.id || index} 
                  className="item-card" 
                  onClick={() => handleItemClick(item.id)}
                >
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
                <button 
                    className={`add-to-cart-btn ${(item?.amount <= 0) ? 'disabled' : ''}`}
                    disabled={item?.amount <= 0}
                >
                    {(item?.amount <= 0) ? '품절' : '장바구니 담기'}
                </button>
                <button 
                    className="view-details-btn"
                    onClick={(e) => {
                        e.stopPropagation(); // 상위 요소로 클릭 이벤트 전파 방지
                        handleItemClick(item.id);
                    }}
                >
                    상세보기
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

