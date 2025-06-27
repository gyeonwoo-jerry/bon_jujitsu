import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchBoardList.css";

const NoticeBoardList = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [branchId, setBranchId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

  // 중복 요청 방지를 위한 ref
  const isRequestInProgress = useRef(false);
  const abortControllerRef = useRef(null);

  // URL에서 브랜치 ID 추출
  useEffect(() => {
    if (params && params.branchId) {
      setBranchId(params.branchId);
      console.log("params에서 브랜치 ID 찾음:", params.branchId);
    } else {
      const path = location.pathname;
      console.log("현재 URL 경로:", path);

      const matches = path.match(/branches\/(\d+)/);
      if (matches && matches[1]) {
        setBranchId(matches[1]);
        console.log("URL 경로에서 브랜치 ID 추출됨:", matches[1]);
      } else {
        console.warn("URL에서 브랜치 ID를 찾을 수 없습니다");
        setBranchId(null);
      }
    }
  }, [params, location.pathname]);

  const apiEndpoint = '/notice';

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');

    console.log('token 체크:');
    console.log('  - token:', token);
    console.log('  - accessToken:', accessToken);

    // token 또는 accessToken 둘 중 하나라도 있으면 로그인 상태
    const loggedIn = !!(token || accessToken);
    console.log('  - 최종 로그인 상태:', loggedIn);

    return loggedIn;
  };

  // 해당 지부의 Owner인지 확인 (공지사항 작성 권한)
  const isBranchOwner = () => {
    console.log('=== 지부 Owner 확인 시작 ===');

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    console.log('parsed userInfo:', userInfo);
    console.log('현재 branchId:', branchId);
    console.log('branchId 타입:', typeof branchId);

    // 관리자는 모든 지부에 글쓰기 가능
    if (userInfo.isAdmin === true) {
      console.log('✅ 관리자 권한으로 허용');
      return true;
    }

    // 사용자의 지부 정보 확인 (branchRoles 배열에서 Owner 역할 확인)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      console.log('branchRoles 배열:', userInfo.branchRoles);

      const isOwner = userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        console.log(`비교: ${userBranchId} (${typeof userBranchId}) === ${currentBranchId} (${typeof currentBranchId})`);
        console.log(`역할: ${role}`);
        console.log(`문자열 비교: "${userBranchId}" === "${currentBranchId}" = ${String(userBranchId) === String(currentBranchId)}`);
        console.log(`Owner 역할 확인: ${role} === "OWNER" = ${role === "OWNER"}`);

        // 안전한 비교: 브랜치 ID가 일치하고 역할이 OWNER인지 확인
        return String(userBranchId) === String(currentBranchId) && role === "OWNER";
      });

      console.log('✅ 최종 지부 Owner 여부:', isOwner);
      return isOwner;
    } else {
      console.log('❌ branchRoles 정보 없음');
    }

    return false;
  };

  // 글쓰기 권한 확인 (React 상태 업데이트를 위해 useEffect 사용)
  const [canWriteState, setCanWriteState] = useState(false);

  useEffect(() => {
    const checkWritePermission = () => {
      const loggedIn = isLoggedIn();
      const branchOwner = isBranchOwner();
      const permission = loggedIn && branchOwner;

      console.log('=== 권한 체크 (useEffect) ===');
      console.log('로그인 상태:', loggedIn);
      console.log('지부 Owner:', branchOwner);
      console.log('최종 권한:', permission);
      console.log('현재 canWriteState:', canWriteState);
      console.log('새로운 권한으로 설정:', permission);

      setCanWriteState(permission);
    };

    // branchId가 설정된 후에 권한 체크
    if (branchId) {
      checkWritePermission();
    }
  }, [branchId]); // branchId가 변경될 때마다 실행

  // 추가: userInfo가 변경될 때도 체크 (로그인 후)
  useEffect(() => {
    const checkWritePermission = () => {
      if (branchId) {
        const loggedIn = isLoggedIn();
        const branchOwner = isBranchOwner();
        const permission = loggedIn && branchOwner;

        console.log('=== 권한 체크 (userInfo 변경) ===');
        console.log('브랜치ID:', branchId);
        console.log('로그인 상태:', loggedIn);
        console.log('지부 Owner:', branchOwner);
        console.log('최종 권한:', permission);

        setCanWriteState(permission);
      }
    };

    // localStorage 변경 감지
    const handleStorageChange = () => {
      console.log('localStorage 변경 감지됨');
      checkWritePermission();
    };

    // 컴포넌트 마운트 시에도 한 번 체크
    checkWritePermission();

    // storage 이벤트 리스너 추가
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [branchId]);

  // 글쓰기 권한 확인
  const canWrite = () => {
    return canWriteState;
  };

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

  // fetchPosts 함수 - 중복 요청 방지 로직 강화
  const fetchPosts = useCallback(async (pageIndex) => {
    if (!branchId) {
      setLoading(false);
      setError('지점 ID가 필요합니다. 올바른 지점 페이지로 이동해주세요.');
      return;
    }

    // 이미 요청 중이면 중단
    if (isRequestInProgress.current) {
      console.log("이미 요청 중이므로 건너뜁니다.");
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

    console.log(`API 요청: ${apiEndpoint}?page=${serverPageIndex}&size=${pageSize}&branchId=${branchId}`);

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await API.get(
          `${apiEndpoint}?page=${serverPageIndex}&size=${pageSize}&branchId=${branchId}`,
          {
            headers,
            signal: abortControllerRef.current.signal // 요청 취소를 위한 signal 추가
          }
      );

      console.log("응답 데이터:", response.data);

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
        console.log('요청이 취소되었습니다.');
        return;
      }

      console.error('게시판 목록 가져오기 오류:', error);
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

  // 게시물 불러오기 - 의존성 배열 단순화
  useEffect(() => {
    if (branchId) {
      console.log("브랜치 ID 감지됨:", branchId, "현재 페이지:", currentPage);
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
  }, [branchId, currentPage]);

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
    if (!id) {
      console.error("유효하지 않은 게시물 ID입니다");
      return;
    }
    navigate(`/branches/${branchId}/notice/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    // 이미 같은 페이지면 요청하지 않음
    const internalPageIndex = pageNumber - 1;
    if (internalPageIndex === currentPage) {
      return;
    }

    console.log(`페이지 변경: UI 페이지 ${pageNumber} -> 내부 인덱스 ${internalPageIndex}`);
    setCurrentPage(internalPageIndex);
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const truncateContent = (content, maxLength = 100) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

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

  if (loading) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>게시판 정보를 불러오는 중...</p>
    </div>;
  }

  if (dataLoaded && posts.length === 0) {
    return <div className="branch-board-container">
      <div className="board-header">
        <h1 className="board-title">지부 공지사항</h1>
        <button
            onClick={handleWriteClick}
            disabled={!canWriteState}
            className="write-button"
        >
          글쓰기 {canWriteState ? '(활성)' : '(비활성)'}
        </button>
      </div>
      <div className="board_empty">
        <div className="empty-posts-container">
          <div className="empty-posts-icon">📭</div>
          <p className="empty-posts-message">등록된 공지사항이 없습니다.</p>
          <p className="empty-posts-submessage">첫 번째 공지사항을 작성해보세요!</p>
        </div>
      </div>
    </div>;
  }

  if (error && !dataLoaded) {
    return <div className="error-container">
      <p className="error-message">{error}</p>
      {branchId && (
          <button className="retry-button" onClick={() => fetchPosts(currentPage)}>
            다시 시도
          </button>
      )}
    </div>;
  }

  return (
      <div className="branch-board-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 className="board-title">지부 공지사항</h1>
          <button
              onClick={handleWriteClick}
              disabled={!canWrite()}
              style={{ opacity: canWrite() ? 1 : 0.5, cursor: canWrite() ? 'pointer' : 'not-allowed' }}
          >
            글쓰기
          </button>
        </div>

        <table className="board-list">
          <colgroup>
            <col width='15%' />
            <col width='35%' />
            <col width='15%' />
            <col width='10%' />
            <col width='15%' />
            <col width='10%' />
          </colgroup>
          <thead>
          <tr>
            <th>이미지</th>
            <th>제목</th>
            <th>지부</th>
            <th>작성자</th>
            <th>작성일</th>
            <th>조회수</th>
            <th>댓글수</th>
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
                      {Array.isArray(post.images) && post.images.length > 0 ? (
                          <>
                            <img
                                src={normalizeImageUrl(post.images[0].url)}
                                alt={`${post.title || "게시물"} 이미지`}
                                className="post-thumbnail"
                            />
                            {post.images.length > 1 && (
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
                <td className={`post-region ${!post.region ? "display_none" : ""}`}>
                  {post.region || ""}
                </td>
                <td className="post-author">
                  {post?.owner?.name || post.writer || post.name || "작성자 없음"}
                </td>
                <td className="post-date">
                  {post.date || (post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : "날짜 정보 없음")}
                </td>
                <td className="post-views">
                  {post.viewCount || 0}
                </td>
                <td className="post-comments">
                  {post.commentCount || 0}
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

export default NoticeBoardList;