import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import ProductTable from '../../components/admin/ProductTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import AdminHeader from '../../components/admin/AdminHeader';
import { getWithExpiry } from '../../utils/storage';
import { Link } from 'react-router-dom';
import '../../styles/admin/productManagement.css';

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  const fetchProducts = async () => {
    // 토큰 확인
    if (!checkToken()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage + 1); // 백엔드는 1부터 시작하므로 +1 처리
      params.append('size', 10);

      // 검색어가 있는 경우 추가 (백엔드는 name 파라미터를 사용)
      if (searchKeyword) {
        params.append('name', searchKeyword);
      }

      console.log('API 요청 시작:', `/items?${params.toString()}`);

      const res = await API.get(`/items?${params.toString()}`);

      console.log('API 응답:', res.data);

      // HTML 응답 체크
      if (typeof res.data === 'string') {
        console.error('HTML 응답 감지. 인증 문제일 수 있습니다.');
        setError('서버에서 올바른 응답을 받지 못했습니다. 다시 로그인해주세요.');
        return;
      }

      if (res.data?.success) {
        const data = res.data?.content;
        setProducts(data?.list || []);
        setTotalPages(data?.totalPage || 0);
      } else {
        console.error('조회 실패:', res.data?.message);
        setError('상품 목록을 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('API 호출 오류:', err);

      if (err.response) {
        console.error('오류 상태:', err.response.status);

        if (err.response.status === 401) {
          setError('인증에 실패했습니다. 다시 로그인해주세요.');
        } else {
          setError(`서버 오류가 발생했습니다 (${err.response.status}): ${err.message || '알 수 없는 오류'}`);
        }
      } else if (err.request) {
        setError('서버로부터 응답이 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError('요청 설정 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    fetchProducts();
  }, [currentPage]);

  // 검색 처리
  const handleSearch = () => {
    setCurrentPage(0);
    fetchProducts();
  };

  // 검색 입력 변경 처리
  const handleSearchInputChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 상품 삭제 처리
  const handleDeleteProduct = async (productId) => {
    if (!checkToken()) return;

    if (!window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await API.delete(`/items/${productId}`);

      if (res.data?.success) {
        alert('상품이 성공적으로 삭제되었습니다.');
        fetchProducts(); // 상품 목록 새로고침
      } else {
        alert('삭제 실패: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('상품 삭제 오류:', err);
      alert('상품 삭제 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    }
  };

  return (
      <div className="product-management">
        <AdminHeader />

        <h2 className="title">상품관리(상품리스트)</h2>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <SearchBar
            searchKeyword={searchKeyword}
            onSearchInputChange={handleSearchInputChange}
            onSearch={handleSearch}
            placeholder="상품명을 입력하세요"
            // showRegionDropdown 속성을 전달하지 않으면 기본값인 false가 적용되어 드롭박스가 표시되지 않음
        />

        {loading ? (
            <div className="loading-indicator">
              데이터를 불러오는 중입니다...
            </div>
        ) : (
            <>
              <ProductTable
                  products={products}
                  onDelete={handleDeleteProduct}
              />

              <div className="action-buttons">
                <Link to="/admin/products/create" className="register-button">
                  등록하기
                </Link>
              </div>

              {products.length > 0 && (
                  <Pagination
                      currentPage={currentPage + 1}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page - 1)}
                  />
              )}
            </>
        )}
      </div>
  );
};

export default ProductManagement;