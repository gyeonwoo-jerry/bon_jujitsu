// pages/admin/PostManagement.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import API from '../../utils/api';
import Pagination from '../../components/admin/Pagination';
import PostTable from '../../components/admin/PostTable';
import AdminHeader from '../../components/admin/AdminHeader';
import { getWithExpiry } from '../../utils/storage';
import '../../styles/admin/postManagement.css';

const PostManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 쿼리 파라미터에서 카테고리 가져오기
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || '';
  };

  // 게시판 카테고리 상태 (전체)
  const [allCategories] = useState([
    { id: 'Board', name: 'Board', apiPath: '/board', needsBranch: true, needsAuthor: true },
    { id: 'Notice', name: 'Notice', apiPath: '/notice', needsBranch: true, needsAuthor: true },
    { id: 'News', name: 'News', apiPath: '/news', needsBranch: false, needsAuthor: false },
    { id: 'Skill', name: 'Skill', apiPath: '/skill', needsBranch: false, needsAuthor: false },
    { id: 'Sponsor', name: 'Sponsor', apiPath: '/sponsor', needsBranch: false, needsAuthor: false }
  ]);

  // 현재 사용자가 볼 수 있는 카테고리
  const [availableCategories, setAvailableCategories] = useState([]);

  // 현재 선택된 카테고리
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());

  // 검색 필터
  const [searchQuery, setSearchQuery] = useState('');

  // 게시글 데이터
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(0);
  const [postsPerPage] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // 권한 체크
  const [userRole, setUserRole] = useState('');

  // 검색 및 리스트 표시 상태
  const [searchPerformed, setSearchPerformed] = useState(false);

  // ADMIN용 지부 region 목록 (MemberManagement와 동일)
  const [regions, setRegions] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regionsLoading, setRegionsLoading] = useState(false);

  // OWNER용 지부 관리 (MemberManagement와 동일)
  const [userBranchIds, setUserBranchIds] = useState([]);
  const [userBranches, setUserBranches] = useState([]);
  const [selectedOwnerBranch, setSelectedOwnerBranch] = useState('');

  // API 호출 중복 방지를 위한 ref
  const apiCallInProgress = useRef(false);
  const isInitialMount = useRef(true);

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  // 지부 목록을 가져와서 고유한 region 추출 (ADMIN 권한일 때만)
  const fetchRegions = async () => {
    setRegionsLoading(true);
    try {
      const res = await API.get("/branch/all?page=1&size=1000");
      if (res.data?.success) {
        const branches = res.data.content?.list || [];
        setAllBranches(branches);

        // 중복되지 않는 region 값들만 추출
        const uniqueRegions = [...new Set(branches.map(branch => branch.region))];
        setRegions(uniqueRegions.sort());
        console.log("고유한 지부 region 목록:", uniqueRegions);
        console.log("모든 지부 정보:", branches);
      } else {
        console.error("브랜치 목록 조회 실패:", res.data?.message);
      }
    } catch (err) {
      console.error("브랜치 목록 조회 오류:", err);
    } finally {
      setRegionsLoading(false);
    }
  };

  // 모든 지부 정보 가져오기 (OWNER도 사용)
  const fetchAllBranches = async () => {
    try {
      const res = await API.get("/branch/all?page=1&size=1000");
      if (res.data?.success) {
        const branches = res.data.content?.list || [];
        setAllBranches(branches);
        console.log("모든 지부 정보 로드:", branches);
      }
    } catch (err) {
      console.error("전체 지부 정보 조회 오류:", err);
    }
  };

  // region 선택 핸들러 (ADMIN용) - 클릭 즉시 데이터 로드
  const handleRegionClick = (region) => {
    setSelectedRegion(prevRegion => prevRegion === region ? "" : region);
    setCurrentPage(0);

    // Board, Notice 카테고리이고 선택된 카테고리가 있을 때만 즉시 검색
    if (selectedCategory && getCurrentCategoryInfo()?.needsBranch) {
      setSearchPerformed(true);
      // 약간의 지연 후 검색 실행 (상태 업데이트 후)
      setTimeout(() => {
        fetchPosts();
      }, 100);
    } else {
      setSearchPerformed(false);
      setPosts([]);
    }
  };

  // OWNER 지부 선택 핸들러 - 선택 즉시 데이터 로드
  const handleOwnerBranchChange = (e) => {
    setSelectedOwnerBranch(e.target.value);
    setCurrentPage(0);

    // Board, Notice 카테고리이고 선택된 카테고리가 있을 때만 즉시 검색
    if (selectedCategory && getCurrentCategoryInfo()?.needsBranch) {
      setSearchPerformed(true);
      // 약간의 지연 후 검색 실행 (상태 업데이트 후)
      setTimeout(() => {
        fetchPosts();
      }, 100);
    } else {
      setSearchPerformed(false);
      setPosts([]);
    }
  };

  // 초기화 및 권한 체크
  useEffect(() => {
    // 토큰 확인
    if (!checkToken()) {
      navigate('/login');
      return;
    }

    // 사용자 권한 체크 및 카테고리 설정
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        const role = user.role || "";
        setUserRole(role);

        // 권한에 따른 카테고리 필터링
        let filteredCategories = [];
        if (role === "ADMIN") {
          // 관리자는 모든 카테고리 접근 가능
          filteredCategories = allCategories;
          // ADMIN인 경우 지부 region 목록 로드
          fetchRegions();
        } else if (role === "OWNER") {
          // 관장은 Board, Notice만 접근 가능
          filteredCategories = allCategories.filter(cat =>
              cat.id === 'Board' || cat.id === 'Notice'
          );

          // OWNER인 경우 지부 정보 처리
          const branchIds = user.branchIds || (user.branchId ? [user.branchId] : []);
          const branches = user.branches || [];
          setUserBranchIds(branchIds);
          setUserBranches(branches);
          console.log("OWNER 지부 정보:", { branchIds, branches });

          // 모든 지부 정보도 로드
          fetchAllBranches();
        } else {
          alert("게시판 관리 권한이 없습니다.");
          navigate('/admin');
          return;
        }

        setAvailableCategories(filteredCategories);

        // URL 파라미터에서 카테고리가 있으면 해당 카테고리 선택, 없으면 첫 번째 카테고리 선택
        const initialCategory = getInitialCategory();
        console.log('URL에서 받은 초기 카테고리:', initialCategory);
        console.log('사용 가능한 카테고리들:', filteredCategories.map(cat => cat.id));

        if (initialCategory && filteredCategories.some(cat => cat.id.toLowerCase() === initialCategory.toLowerCase())) {
          // URL 파라미터의 카테고리가 유효하면 해당 카테고리 선택하고 자동 검색
          const matchedCategory = filteredCategories.find(cat => cat.id.toLowerCase() === initialCategory.toLowerCase());
          console.log('매칭된 카테고리:', matchedCategory);
          setSelectedCategory(matchedCategory.id);

          // Board, Notice 카테고리가 아닌 경우에만 자동 검색 (지부 선택이 필요없는 경우)
          if (!matchedCategory.needsBranch) {
            setTimeout(() => {
              console.log('자동 검색 실행');
              setSearchPerformed(true);
              fetchPosts();
            }, 500);
          }
        } else if (filteredCategories.length > 0) {
          // URL 파라미터가 없거나 유효하지 않으면 첫 번째 카테고리 선택
          console.log('기본 카테고리 선택:', filteredCategories[0].id);
          setSelectedCategory(filteredCategories[0].id);
        }

      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
        navigate('/admin');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // 페이지 변경시 데이터 다시 로드 (검색이 수행된 상태에서만)
  useEffect(() => {
    if (!isInitialMount.current && searchPerformed && selectedCategory) {
      console.log('페이지 변경 - fetchPosts 호출, 페이지:', currentPage);
      fetchPosts();
    }
  }, [currentPage]);

  // 카테고리 변경시 별도 처리
  useEffect(() => {
    if (!isInitialMount.current && selectedCategory) {
      setCurrentPage(0);
      setSearchPerformed(false);
      setPosts([]);
      setSearchQuery('');
      setSelectedRegion('');
      setSelectedOwnerBranch('');
      setError(null);
    }
  }, [selectedCategory]);

  // region 변경 시 데이터 로드 제거 (handleRegionClick에서 직접 처리)
  // useEffect(() => {
  //   if (userRole === "ADMIN" && selectedCategory && getCurrentCategoryInfo()?.needsBranch && searchPerformed) {
  //     setCurrentPage(0);
  //     fetchPosts();
  //   }
  // }, [selectedRegion]);

  // OWNER 지부 선택 변경 시 데이터 로드 제거 (handleOwnerBranchChange에서 직접 처리)
  // useEffect(() => {
  //   if (userRole === "OWNER" && selectedCategory && getCurrentCategoryInfo()?.needsBranch && searchPerformed && userBranches.length > 1) {
  //     setCurrentPage(0);
  //     fetchPosts();
  //   }
  // }, [selectedOwnerBranch]);

  // 게시글 데이터 가져오기
  const fetchPosts = async () => {
    // 이미 API 호출 중이면 중복 호출 방지
    if (apiCallInProgress.current || loading) {
      console.log('이미 API 호출 중입니다. 중복 호출 방지.');
      return;
    }

    // 토큰 확인
    if (!checkToken()) return;

    // 페이지 검증
    if (currentPage < 0) {
      console.warn("현재 페이지가 0보다 작습니다. 0으로 보정합니다.");
      setCurrentPage(0);
      return;
    }

    setLoading(true);
    apiCallInProgress.current = true;
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage + 1);
      params.append('size', postsPerPage);

      // 현재 선택된 카테고리 정보 가져오기
      const categoryInfo = allCategories.find(cat => cat.id === selectedCategory);

      if (!categoryInfo) {
        setError('선택된 카테고리 정보를 찾을 수 없습니다.');
        return;
      }

      // Board, Notice의 경우
      if (categoryInfo.needsBranch) {
        // 작성자 검색
        if (searchQuery.trim()) {
          params.append('name', searchQuery.trim());
        }

        // 지부 검색 (MemberManagement 방식 적용)
        if (userRole === "OWNER") {
          // OWNER는 자신이 관리하는 지부의 게시글 조회
          const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
          const branchRoles = userInfo.branchRoles || [];
          const ownerBranches = branchRoles.filter(br => br.role === "OWNER");

          if (selectedOwnerBranch) {
            // 특정 지부를 선택한 경우
            params.append("branchId", selectedOwnerBranch);
          } else if (ownerBranches.length > 0) {
            // 전체 선택인 경우 모든 관리 지부 조회
            ownerBranches.forEach(branch => {
              params.append("branchIds", branch.branchId);
            });
          }
        } else if (userRole === "ADMIN" && selectedRegion) {
          // ADMIN인 경우 선택된 region에 해당하는 지부들의 ID를 찾아서 전송
          const selectedBranches = allBranches.filter(branch => branch.region === selectedRegion);
          console.log(`선택된 region "${selectedRegion}"에 해당하는 지부들:`, selectedBranches);

          if (selectedBranches.length === 1) {
            params.append("branchId", selectedBranches[0].id);
          } else if (selectedBranches.length > 1) {
            selectedBranches.forEach(branch => {
              params.append("branchIds", branch.id);
            });
          }
        }
      } else {
        // News, Skill, Sponsor의 경우 - 검색어가 있으면 name 파라미터로 검색
        if (searchQuery.trim()) {
          params.append('name', searchQuery.trim());
        }
      }

      console.log('API 요청 시작:', `${categoryInfo.apiPath}?${params.toString()}`);

      const res = await API.get(categoryInfo.apiPath, { params });

      console.log('API 응답:', res.data);

      // HTML 응답 체크
      if (typeof res.data === 'string') {
        console.error('HTML 응답 감지. 인증 문제일 수 있습니다.');
        setError('서버에서 올바른 응답을 받지 못했습니다. 다시 로그인해주세요.');
        return;
      }

      if (res.data?.success) {
        const data = res.data?.content;

        const transformedPosts = data?.list?.map(item => {
          return {
            id: item.id,
            title: item.title || item.name,
            author: item.author || item.creator?.name || '관리자',
            date: item.createdAt || item.createdDate || new Date().toISOString().split('T')[0]
          };
        }) || [];

        setPosts(transformedPosts);
        setTotalPages(data?.totalPage || 0);
        setTotalPosts(data?.totalElements || data?.totalCount || 0);
      } else {
        console.error('조회 실패:', res.data?.message);
        setError('게시글 목록을 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
        setPosts([]);
        setTotalPages(0);
        setTotalPosts(0);
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

      setPosts([]);
      setTotalPages(0);
      setTotalPosts(0);
    } finally {
      setLoading(false);
      apiCallInProgress.current = false;
      isInitialMount.current = false;
    }
  };

  // 검색 핸들러
  const handleSearch = () => {
    const categoryInfo = allCategories.find(cat => cat.id === selectedCategory);

    if (!selectedCategory) {
      alert("카테고리를 선택해주세요.");
      return;
    }

    console.log('검색 조건:', {
      category: selectedCategory,
      searchQuery: searchQuery.trim(),
      selectedRegion: selectedRegion,
      selectedOwnerBranch: selectedOwnerBranch
    });

    // 검색 시 페이지를 0으로 리셋하고 검색 수행
    setCurrentPage(0);
    setSearchPerformed(true);
    fetchPosts();
  };

  // 카테고리 변경 핸들러
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    console.log('카테고리 변경:', newCategory);

    setSelectedCategory(newCategory);
    setSearchPerformed(false);
    setPosts([]);
    setSearchQuery('');
    setSelectedRegion('');
    setSelectedOwnerBranch('');
    setCurrentPage(0);
    setError(null);
  };

  // 게시글 삭제 핸들러
  const handleDelete = async (id) => {
    if (!checkToken()) return;

    if (window.confirm('정말로 삭제하시겠습니까?')) {
      try {
        const categoryInfo = allCategories.find(cat => cat.id === selectedCategory);
        const res = await API.delete(`${categoryInfo.apiPath}/${id}`);

        if (res.data?.success) {
          alert('게시글이 성공적으로 삭제되었습니다.');
          fetchPosts();
        } else {
          alert('삭제 실패: ' + (res.data?.message || '알 수 없는 오류'));
        }
      } catch (err) {
        console.error('게시글 삭제 오류:', err);
        if (err.response?.data?.message) {
          alert('삭제 실패: ' + err.response.data.message);
        } else if (err.response?.status === 401) {
          alert('인증에 실패했습니다. 다시 로그인해주세요.');
        } else {
          alert('게시글 삭제 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
        }
      }
    }
  };

  // 게시글 수정 페이지 이동 핸들러
  const handleEdit = (id) => {
    navigate(`/admin/posts/edit/${selectedCategory.toLowerCase()}/${id}`);
  };

  // 게시글 상세 페이지 이동 핸들러
  const handleDetail = (id) => {
    const pathSegment = selectedCategory.toLowerCase();
    window.open(`/${pathSegment}/${id}`, '_blank');
  };

  // 등록하기 버튼 표시 여부 함수
  const shouldShowRegisterButton = () => {
    // Board, Notice는 role에 상관없이 등록하기 버튼 숨김
    if (selectedCategory === 'Board' || selectedCategory === 'Notice') {
      return false;
    }
    // Sponsor, News, Skill은 항상 표시 (해당 카테고리에 접근 가능한 사용자만 볼 수 있으므로)
    return selectedCategory === 'Sponsor' || selectedCategory === 'News' || selectedCategory === 'Skill';
  };

  // 현재 카테고리 정보 가져오기
  const getCurrentCategoryInfo = () => {
    return allCategories.find(cat => cat.id === selectedCategory);
  };

  return (
      <div className="post-management">
        <AdminHeader />

        <h2 className="post_title">게시판관리(게시판리스트)</h2>

        {error && (
            <div className="error-message" style={{
              backgroundColor: '#fde2e2',
              color: '#d32f2f',
              padding: '10px',
              borderRadius: '4px',
              margin: '10px 0',
              borderLeft: '4px solid #d32f2f'
            }}>
              {error}
            </div>
        )}

        <div className="search-container">
          <div className="search-form">
            {/* 구분 드롭박스 */}
            <div className="form-group">
              <label htmlFor="category-select">구분:</label>
              <select
                  id="category-select"
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  className="form-select"
              >
                <option value="">선택하세요</option>
                {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                ))}
              </select>
            </div>

            {/* Board, Notice일 때만 작성자 검색창 표시 */}
            {getCurrentCategoryInfo()?.needsAuthor && (
                <div className="form-group">
                  <label htmlFor="search-input">작성자:</label>
                  <input
                      id="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="작성자"
                      className="form-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                  />
                </div>
            )}

            {/* News, Skill, Sponsor일 때는 제목 검색창 표시 */}
            {!getCurrentCategoryInfo()?.needsAuthor && getCurrentCategoryInfo()?.id && (
                <div className="form-group">
                  <label htmlFor="search-input">제목:</label>
                  <input
                      id="search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="제목 검색"
                      className="form-input"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSearch();
                        }
                      }}
                  />
                </div>
            )}

            {/* 검색 버튼 */}
            <div className="form-group">
              <button
                  onClick={handleSearch}
                  className="search-button"
                  disabled={loading}
                  style={loading ? { backgroundColor: '#cccccc', cursor: 'not-allowed' } : {}}
              >
                {loading ? '로딩중...' : (getCurrentCategoryInfo()?.needsAuthor ? '검색' : '조회')}
              </button>
            </div>
          </div>
        </div>

        {/* ADMIN인 경우 지부 region 탭들 표시 (Board, Notice 카테고리에서만) */}
        {userRole === "ADMIN" && getCurrentCategoryInfo()?.needsBranch && (
            <div className="region-tabs">
              <div className="region-tabs-header">
                <span className="region-tabs-label">지부별 조회:</span>
                {regionsLoading && <span className="loading-text">지부 목록 로딩 중...</span>}
              </div>
              <div className="region-buttons">
                <button
                    className={`region-button ${selectedRegion === "" ? 'active' : ''}`}
                    onClick={() => handleRegionClick("")}
                >
                  전체
                </button>
                {regions.map((region) => (
                    <button
                        key={region}
                        className={`region-button ${selectedRegion === region ? 'active' : ''}`}
                        onClick={() => handleRegionClick(region)}
                    >
                      {region}
                    </button>
                ))}
              </div>
            </div>
        )}

        {/* OWNER인 경우 지부 선택 드롭다운 (Board, Notice 카테고리이고 여러 지부 관리 시에만) */}
        {userRole === "OWNER" && getCurrentCategoryInfo()?.needsBranch && userBranches.length > 1 && (
            <div className="owner-branch-selector">
              <label className="branch-selector-label">관리 지부 선택:</label>
              <select
                  value={selectedOwnerBranch}
                  onChange={handleOwnerBranchChange}
                  className="form-select"
              >
                <option value="">전체 관리 지부</option>
                {userBranches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.region} ({branch.area})
                    </option>
                ))}
              </select>
            </div>
        )}

        {/* 현재 선택된 조건 표시 */}
        {userRole === "ADMIN" && selectedRegion && getCurrentCategoryInfo()?.needsBranch && (
            <div className="current-filter">
              <span className="filter-label">현재 조회 중:</span>
              <span className="filter-value">{selectedRegion} 지부</span>
            </div>
        )}

        {/* 검색이 수행된 경우에만 테이블 표시 */}
        {searchPerformed && (
            <>
              {loading ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: '14px', color: '#666' }}>
                    데이터를 불러오는 중입니다...
                  </div>
              ) : (
                  <>
                    <PostTable
                        posts={posts}
                        loading={loading}
                        selectedCategory={selectedCategory}
                        userRole={userRole}
                        onDetail={handleDetail}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />

                    {posts.length > 0 && shouldShowRegisterButton() && (
                        <div className="action-buttons">
                          <Link to={`/admin/posts/create?category=${selectedCategory.toLowerCase()}`} className="register-button">
                            등록하기
                          </Link>
                        </div>
                    )}

                    {posts.length > 0 && (
                        <Pagination
                            currentPage={currentPage + 1}
                            totalPages={totalPages}
                            onPageChange={(page) => {
                              const newPage = Math.max(page - 1, 0);
                              console.log('페이지 변경:', page, '-> 내부 상태:', newPage);
                              setCurrentPage(newPage);
                            }}
                        />
                    )}
                  </>
              )}
            </>
        )}

        {/* 검색을 수행했지만 결과가 없는 경우 */}
        {searchPerformed && !loading && posts.length === 0 && !error && (
            <div className="no-data-message" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              {getCurrentCategoryInfo()?.needsAuthor ? '검색 결과가 없습니다.' : '데이터가 없습니다.'}
            </div>
        )}
      </div>
  );
};

export default PostManagement;