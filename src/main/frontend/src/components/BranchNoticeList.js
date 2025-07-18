import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchBoardList.css";

const BranchNoticeList = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState(null);
  const [branchInfo, setBranchInfo] = useState(null); // 지부 정보 상태 추가
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [canWriteState, setCanWriteState] = useState(false);

  // 중복 요청 방지를 위한 ref
  const isRequestInProgress = useRef(false);
  const abortControllerRef = useRef(null);

  // URL에서 브랜치 ID 추출
  useEffect(() => {
    if (params && params.branchId) {
      setBranchId(params.branchId);
    } else {
      const path = location.pathname;
      const matches = path.match(/branches\/(\d+)/);
      if (matches && matches[1]) {
        setBranchId(matches[1]);
      } else {
        setBranchId(null);
      }
    }
  }, [params, location.pathname]);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  // 해당 지부의 Owner인지 확인 (공지사항 작성 권한)
  const isBranchOwner = () => {
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 모든 지부에 글쓰기 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (branchRoles 배열에서 Owner 역할 확인)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      return userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const role = branchRole.role;

        // 안전한 비교: 브랜치 ID가 일치하고 역할이 OWNER인지 확인
        return String(userBranchId) === String(branchId) && role === "OWNER";
      });
    }

    return false;
  };

  // 지부 정보 가져오기
  const fetchBranchInfo = useCallback(async () => {
    if (!branchId) return;

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await API.get(`/branches/${branchId}`, { headers });

      if (response.status === 200 && response.data.success) {
        setBranchInfo(response.data.data);
      }
    } catch (error) {
      console.warn('지부 정보를 불러오는 중 오류:', error);
    }
  }, [branchId]);

  // 글쓰기 권한 확인 및 상태 업데이트
  useEffect(() => {
    const checkWritePermission = () => {
      const loggedIn = isLoggedIn();
      const branchOwner = isBranchOwner();
      const permission = loggedIn && branchOwner;
      setCanWriteState(permission);
    };

    if (branchId) {
      checkWritePermission();
      fetchBranchInfo();
    }

    // localStorage 변경 감지
    const handleStorageChange = () => {
      checkWritePermission();
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [branchId, fetchBranchInfo]);

  // 글쓰기 버튼 클릭 핸들러
  const handleWriteClick = () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!isBranchOwner()) {
      alert('해당 지부의 Owner만 공지사항을 작성할 수 있습니다.');
      return;
    }

    navigate(`/branches/${branchId}/notice/write`);
  };

  // 게시물 불러오기
  const fetchPosts = useCallback(async (pageIndex) => {
    if (!branchId) {
      setLoading(false);
      setError('지점 ID가 필요합니다. 올바른 지점 페이지로 이동해주세요.');
      return;
    }

    // 이미 요청 중이면 중단
    if (isRequestInProgress.current) {
      return;
    }

    // 이전 요청이 있다면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();

    const serverPageIndex = pageIndex + 1;

    isRequestInProgress.current = true;
    setLoading(true);
    setError('');

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await API.get(
          `/notice?page=${serverPageIndex}&size=${pageSize}&branchId=${branchId}`,
          {
            headers,
            signal: abortControllerRef.current.signal
          }
      );

      if (response.status === 200) {
        if (response.data.success) {
          setDataLoaded(true);
          setPosts(response.data.content.list || []);
          setTotalPages(response.data.content.totalPage || 1);
          setError('');
        } else {
          setPosts([]);
          setError(response.data.message || '게시물을 불러올 수 없습니다.');
        }
      }
    } catch (error) {
      // AbortError는 의도적인 취소이므로 에러로 처리하지 않음
      if (error.name === 'AbortError') {
        return;
      }

      setDataLoaded(false);

      if (error.response) {
        if (error.response.status === 401) {
          setError('로그인이 필요합니다.');
        } else if (error.response.status === 403) {
          setError('접근 권한이 없습니다.');
        } else {
          setError(`게시판 정보를 불러올 수 없습니다. (${error.response.status})`);
        }
      } else if (error.request) {
        setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
      } else {
        setError('요청 중 오류가 발생했습니다.');
      }
      setPosts([]);
    } finally {
      isRequestInProgress.current = false;
      setLoading(false);
    }
  }, [branchId, pageSize]);

  // 게시물 불러오기
  useEffect(() => {
    if (branchId) {
      fetchPosts(currentPage);
    } else {
      setLoading(false);
      setError('지점 정보가 없습니다. URL을 확인해주세요.');
    }

    // cleanup 함수로 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [branchId, currentPage, fetchPosts]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      isRequestInProgress.current = false;
    };
  }, []);

  const handlePostClick = (id) => {
    if (!id) return;
    navigate(`/branches/${branchId}/notice/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    const internalPageIndex = pageNumber - 1;
    if (internalPageIndex === currentPage) {
      return;
    }
    setCurrentPage(internalPageIndex);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const safePostsArray = Array.isArray(posts) ? posts : [];

  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
      return "/images/blank_img.png";
    }

    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }

    return `/${url}`;
  };

  // 지부 정보 표시 함수
  const getBranchDisplayName = () => {
    if (!branchInfo) return '지부 공지사항';

    const region = branchInfo.region || '';
    const area = branchInfo.area || '';

    if (region && area) {
      return `${region} ${area} 지부 공지사항`;
    } else if (region) {
      return `${region} 지부 공지사항`;
    } else if (area) {
      return `${area} 지부 공지사항`;
    }

    return '지부 공지사항';
  };

  if (loading) {
    return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>게시판 정보를 불러오는 중...</p>
        </div>
    );
  }

  if (dataLoaded && posts.length === 0) {
    return (
        <div className="branch-board-container">
          <div className="board-header">
            <h1 className="board-title">{getBranchDisplayName()}</h1>
            <button
                onClick={handleWriteClick}
                disabled={!canWriteState}
                className="write-button"
            >
              글쓰기
            </button>
          </div>
          <div className="board_empty">
            <div className="empty-posts-container">
              <div className="empty-posts-icon">📭</div>
              <p className="empty-posts-message">등록된 공지사항이 없습니다.</p>
              <p className="empty-posts-submessage">첫 번째 공지사항을 작성해보세요!</p>
            </div>
          </div>
        </div>
    );
  }

  if (error && !dataLoaded) {
    return (
        <div className="error-container">
          <p className="error-message">{error}</p>
          {branchId && (
              <button className="retry-button" onClick={() => fetchPosts(currentPage)}>
                다시 시도
              </button>
          )}
        </div>
    );
  }

  return (
      <div className="branch-board-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 className="board-title">{getBranchDisplayName()}</h1>
          <button
              onClick={handleWriteClick}
              disabled={!canWriteState}
              style={{
                opacity: canWriteState ? 1 : 0.5,
                cursor: canWriteState ? 'pointer' : 'not-allowed'
              }}
          >
            글쓰기
          </button>
        </div>

        <table className="board-list">
          <colgroup>
            <col width='15%' />
            <col width='40%' />
            <col width='15%' />
            <col width='15%' />
            <col width='15%' />
          </colgroup>
          <thead>
          <tr>
            <th>이미지</th>
            <th>제목</th>
            <th>지부</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회수</th>
          </tr>
          </thead>
          <tbody>
          {safePostsArray.map((post) => (
              <tr
                  key={post.id || `post-${Math.random()}`}
                  className="post-item"
                  onClick={() => post.id && handlePostClick(post.id)}
              >
                <td>
                  <div className="thumbnail">
                    <div className="post-images">
                      {Array.isArray(post.images) && post.media.length > 0 ? (
                          <>
                            <img
                                src={normalizeImageUrl(post.media[0].url)}
                                alt={`${post.title || "게시물"} 이미지`}
                                className="post-thumbnail"
                            />
                            {post.media.length > 1 && (
                                <span className="image-count">
                            +{post.images.length - 1}
                          </span>
                            )}
                          </>
                      ) : (
                          <img
                              src="/images/blank_img.png"
                              alt="기본 이미지"
                              className="post-thumbnail blank"
                          />
                      )}
                    </div>
                  </div>
                </td>
                <td className="post-title">
                  {post.title || "제목 없음"}
                </td>
                <td className={`post-region ${(!branchInfo?.region && !branchInfo?.area) ? "display_none" : ""}`}>
                  {branchInfo?.region || branchInfo?.area || ""}
                </td>
                <td className="post-author">
                  {post?.owner?.name || post.author || post.name || "작성자 없음"}
                </td>
                <td className="post-date">
                  {post.date || (post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : "날짜 정보 없음")}
                </td>
                <td className="post-views">
                  {post.viewCount || 0}
                </td>
              </tr>
          ))}
          </tbody>
        </table>

        {totalPages > 1 && (
            <div className="pagination">
              <button
                  className="pagination-button"
                  disabled={currentPage === 0}
                  onClick={() => handlePageChange(1)}
              >
                이전
              </button>

              {pageNumbers.map((number) => (
                  <button
                      key={number}
                      className={`pagination-number ${currentPage === number - 1 ? "active" : ""}`}
                      onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </button>
              ))}

              <button
                  className="pagination-button"
                  disabled={currentPage === totalPages - 1}
                  onClick={() => handlePageChange(currentPage + 2)}
              >
                다음
              </button>
            </div>
        )}
      </div>
  );
};

export default BranchNoticeList;