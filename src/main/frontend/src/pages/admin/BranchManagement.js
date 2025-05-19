import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import BranchTable from '../../components/admin/BranchTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import { getWithExpiry } from '../../utils/storage';
import { Link } from 'react-router-dom';
import '../../styles/admin/branchManagement.css';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // 백엔드는 1부터 시작하므로 1로 초기화
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState(''); // 지부명 검색어
  const [selectedRegion, setSelectedRegion] = useState(''); // 지역 필터링 (area 파라미터)

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  const fetchBranches = async () => {
    // 토큰 확인
    if (!checkToken()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage); // 백엔드는 1부터 시작
      params.append('size', 10);

      // 지부명 검색어가 있는 경우 추가 (region 파라미터)
      if (searchKeyword) {
        params.append('region', searchKeyword);
      }

      // 지역 필터가 선택되었을 경우 추가 (area 파라미터)
      if (selectedRegion) {
        params.append('area', selectedRegion);
      }

      console.log('API 요청 시작:', `/branch/all?${params.toString()}`);

      const res = await API.get(`/branch/all?${params.toString()}`);

      console.log('API 응답:', res.data);

      // HTML 응답 체크
      if (typeof res.data === 'string') {
        console.error('HTML 응답 감지. 인증 문제일 수 있습니다.');
        setError('서버에서 올바른 응답을 받지 못했습니다. 다시 로그인해주세요.');
        return;
      }

      if (res.data?.success) {
        const data = res.data?.content;
        setBranches(data?.list || []);
        setTotalPages(data?.totalPage || 0);
      } else {
        console.error('조회 실패:', res.data?.message);
        setError('지부 목록을 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
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

  // 컴포넌트 마운트 시 초기 데이터 로드 및 필터 변경 시 데이터 다시 로드
  useEffect(() => {
    fetchBranches();
  }, [currentPage, selectedRegion]); // selectedRegion이 변경될 때도 재로드

  // 검색 처리
  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    fetchBranches();
  };

  // 검색어 입력 변경 처리
  const handleSearchInputChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 지역 변경 처리
  const handleRegionChange = (region) => {
    setSelectedRegion(region); // 지역값 설정 (전체 선택 시 빈 문자열)
    setCurrentPage(1); // 지역 변경 시 첫 페이지로 이동
  };

  // 지부 삭제 처리
  const handleDeleteBranch = async (branchId) => {
    if (!checkToken()) return;

    if (!window.confirm("정말로 이 지부를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await API.delete(`/branch?branchId=${branchId}`);

      if (res.data?.success) {
        alert('지부가 성공적으로 삭제되었습니다.');
        fetchBranches(); // 지부 목록 새로고침
      } else {
        alert('삭제 실패: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('지부 삭제 오류:', err);
      alert('지부 삭제 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    }
  };

  return (
      <div className="branch-management">
        <h2 className="title">지부관리(지부리스트)</h2>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <div className="search-container">
          <SearchBar
              searchKeyword={searchKeyword}
              onSearchInputChange={handleSearchInputChange}
              onSearch={handleSearch}
              placeholder="지부명을 입력하세요"
              showRegionDropdown={true} // 지역 드롭다운 표시
              selectedRegion={selectedRegion}
              onRegionChange={handleRegionChange}
          />
        </div>

        {loading ? (
            <div className="loading-indicator">
              데이터를 불러오는 중입니다...
            </div>
        ) : (
            <>
              <BranchTable
                  branches={branches}
                  onDelete={handleDeleteBranch}
              />

              <div className="action-buttons">
                <Link to="/admin/branches/create" className="register-button">
                  등록하기
                </Link>
              </div>

              {branches.length > 0 && (
                  <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page)}
                  />
              )}
            </>
        )}
      </div>
  );
};

export default BranchManagement;