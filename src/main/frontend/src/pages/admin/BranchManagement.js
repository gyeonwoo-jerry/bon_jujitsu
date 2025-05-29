import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import BranchTable from '../../components/admin/BranchTable';
import SearchBar from '../../components/admin/SearchBar';
import Pagination from '../../components/admin/Pagination';
import AdminHeader from '../../components/admin/AdminHeader';
import { getWithExpiry } from '../../utils/storage';
import { Link } from 'react-router-dom';
import '../../styles/admin/branchManagement.css';

const BranchManagement = () => {
  const [branches, setBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const navigate = useNavigate();

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  // 사용자 정보 확인 함수
  const checkUserRole = () => {
    try {
      // localStorage에서 사용자 정보 가져오기 (LoginForm.js와 동일한 방식)
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        console.log('사용자 정보:', user);

        // LoginForm에서 저장한 role 필드 사용
        if (user.role === 'ADMIN') {
          setUserRole('ADMIN');
          return 'ADMIN';
        }

        // branchRoles에서 OWNER 역할 확인
        if (user.branchRoles && user.branchRoles.length > 0) {
          const ownerRoles = user.branchRoles.filter(branch => branch.role === 'OWNER');
          if (ownerRoles.length > 0) {
            setUserRole('OWNER');
            return 'OWNER';
          }

          // OWNER가 아니면 일반 USER
          setUserRole('USER');
          return 'USER';
        }

        // role 필드가 있으면 그대로 사용
        if (user.role) {
          setUserRole(user.role);
          return user.role;
        }
      }
    } catch (error) {
      console.error('사용자 역할 확인 오류:', error);
    }
    return null;
  };

  // OWNER의 지부 개수 확인 함수
  const getOwnerBranchCount = () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.branchRoles) {
          const ownerRoles = user.branchRoles.filter(branch => branch.role === 'OWNER');
          return ownerRoles.length;
        }
      }
    } catch (error) {
      console.error('OWNER 지부 개수 확인 오류:', error);
    }
    return 0;
  };

  // OWNER의 첫 번째 지부 ID 가져오기
  const getFirstOwnerBranchId = () => {
    try {
      const userInfo = localStorage.getItem("userInfo");
      if (userInfo) {
        const user = JSON.parse(userInfo);
        if (user.branchRoles) {
          const ownerRoles = user.branchRoles.filter(branch => branch.role === 'OWNER');
          if (ownerRoles.length > 0) {
            return ownerRoles[0].branchId;
          }
        }
      }
    } catch (error) {
      console.error('OWNER 지부 ID 확인 오류:', error);
    }
    return null;
  };

  const fetchBranches = async (roleOverride = null) => {
    if (!checkToken()) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('size', 10);

      if (searchKeyword) {
        params.append('region', searchKeyword);
      }

      if (selectedRegion) {
        params.append('area', selectedRegion);
      }

      // roleOverride가 있으면 사용하고, 없으면 userRole state 사용
      const currentRole = roleOverride || userRole;

      // OWNER의 경우 자신의 지부만 조회하도록 지부 ID 추가 (서버 사이드 필터링)
      if (currentRole === 'OWNER') {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          const user = JSON.parse(userInfo);
          if (user.branchRoles) {
            const ownerBranchIds = user.branchRoles
                .filter(branch => branch.role === 'OWNER')
                .map(branch => branch.branchId);

            // 지부 ID들을 쿼리 파라미터로 추가
            ownerBranchIds.forEach(branchId => {
              params.append('branchIds', branchId);
            });

            console.log('OWNER 지부 ID 서버 필터링:', ownerBranchIds);
            console.log('사용된 역할:', currentRole);
          }
        }
      }

      console.log('API 요청 시작:', `/branch/all?${params.toString()}`);

      const res = await API.get(`/branch/all?${params.toString()}`);

      console.log('API 응답:', res.data);

      if (typeof res.data === 'string') {
        console.error('HTML 응답 감지. 인증 문제일 수 있습니다.');
        setError('서버에서 올바른 응답을 받지 못했습니다. 다시 로그인해주세요.');
        return;
      }

      if (res.data?.success) {
        const data = res.data?.content;
        const branchList = data?.list || [];

        // 서버에서 이미 필터링된 결과를 그대로 사용
        setBranches(branchList);
        setTotalPages(data?.totalPage || 0);

        console.log('서버에서 필터링된 지부 목록:', branchList);
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
      setIsInitialLoading(false);
    }
  };

  // 컴포넌트 마운트 시 사용자 역할 확인 및 OWNER 지부 개수 체크
  useEffect(() => {
    const role = checkUserRole();
    console.log('확인된 사용자 역할:', role);

    // OWNER이고 지부가 1개뿐이면 바로 수정 페이지로 이동
    if (role === 'OWNER') {
      const ownerBranchCount = getOwnerBranchCount();
      console.log('OWNER 지부 개수:', ownerBranchCount);

      if (ownerBranchCount === 1) {
        const branchId = getFirstOwnerBranchId();
        console.log('OWNER - 지부 1개 감지, 수정 페이지로 이동:', branchId);
        navigate(`/admin/branches/edit/${branchId}`);
        return;
      }
    }

    // 지부가 여러 개이거나 ADMIN인 경우 목록 페이지 표시
    // role을 fetchBranches에 전달하여 즉시 필터링 적용
    fetchBranches(role);
  }, []);

  // 페이지네이션과 필터 변경을 위한 별도 useEffect
  useEffect(() => {
    if (!isInitialLoading) {
      fetchBranches();
    }
  }, [currentPage, selectedRegion]);

  // 검색 처리
  const handleSearch = () => {
    setCurrentPage(1);
    setIsInitialLoading(false);
    fetchBranches();
  };

  // 검색어 입력 변경 처리
  const handleSearchInputChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  // 지역 변경 처리
  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setCurrentPage(1);
    setIsInitialLoading(false);
  };

  // 지부 삭제 처리
  const handleDeleteBranch = async (branchId) => {
    if (!checkToken()) return;

    if (!window.confirm("정말로 이 지부를 삭제하시겠습니까?")) {
      return;
    }

    try {
      const res = await API.delete(`/branch/${branchId}`);

      if (res.data?.success) {
        alert('지부가 성공적으로 삭제되었습니다.');

        // 삭제 후 OWNER이고 남은 지부가 1개라면 수정 페이지로 이동
        if (userRole === 'OWNER') {
          const ownerBranchCount = getOwnerBranchCount();
          if (ownerBranchCount === 1) {
            const branchId = getFirstOwnerBranchId();
            navigate(`/admin/branches/edit/${branchId}`);
            return;
          }
        }

        fetchBranches();
      } else {
        alert('삭제 실패: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('지부 삭제 오류:', err);
      alert('지부 삭제 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    }
  };

  // 초기 로딩 중이면 로딩 표시
  if (isInitialLoading && loading) {
    return (
        <div className="branch-management">
          <AdminHeader />
          <div className="loading-indicator">
            지부 정보를 확인하는 중입니다...
          </div>
        </div>
    );
  }

  return (
      <div className="branch-management">
        <AdminHeader />

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
              showRegionDropdown={true}
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