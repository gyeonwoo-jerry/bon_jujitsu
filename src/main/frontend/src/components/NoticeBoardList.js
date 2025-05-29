import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchBoardList.css";

const NoticeBoardList = () => {
  // URL 파라미터에서 브랜치 ID 직접 가져오기 (/branches/:branchId)
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // URL에서 브랜치 ID를 추출하는 두 가지 방법 사용
  const [branchId, setBranchId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // 내부적으로는 0부터 시작하는 인덱스 사용
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dataLoaded, setDataLoaded] = useState(false);

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

  // API 엔드포인트 설정
  const apiEndpoint = '/notice';

  // useCallback을 사용하여 fetchPosts 함수를 메모이제이션
  const fetchPosts = useCallback((pageIndex) => {
    if (!branchId) {
      setLoading(false);
      setError('지점 ID가 필요합니다. 올바른 지점 페이지로 이동해주세요.');
      return;
    }

    // 중요: 서버는 페이지 인덱스가 1부터 시작합니다
    // 따라서 내부 인덱스(0부터 시작)에 1을 더해 서버에 전송
    const serverPageIndex = pageIndex + 1;
    
    setLoading(true);
    setError('');
    console.log(`API 요청: ${apiEndpoint}?page=${serverPageIndex}&size=${pageSize}&branchId=${branchId}`);

    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    API.get(`${apiEndpoint}?page=${serverPageIndex}&size=${pageSize}&branchId=${branchId}`, { headers })
      .then((response) => {
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
      })
      .catch((error) => {
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
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiEndpoint, pageSize, branchId]);

  // 페이지가 처음 로드되거나 branchId, currentPage가 변경될 때 게시물 불러오기
  useEffect(() => {

    if (branchId) {
      console.log("브랜치 ID 감지됨:", branchId, "현재 페이지:", currentPage);
      fetchPosts(currentPage);
    } else {
      setLoading(false);
      setError('지점 정보가 없습니다. URL을 확인해주세요.');
    }
  }, [branchId, currentPage, fetchPosts]);

  const handlePostClick = (id) => {
    if (!id) {
      console.error("유효하지 않은 게시물 ID입니다");
      return;
    }
    navigate(`/branches/${branchId}/notice/${id}`);
  };

  const handlePageChange = (pageNumber) => {
    // UI에서는 페이지가 1부터 시작하므로 내부 인덱스로 변환 (0부터 시작)
    const internalPageIndex = pageNumber - 1;
    console.log(`페이지 변경: UI 페이지 ${pageNumber} -> 내부 인덱스 ${internalPageIndex}`);
    setCurrentPage(internalPageIndex);
  };

  // 페이지네이션 부분 수정
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // 게시글 내용 일부만 표시하기 위한 함수
  const truncateContent = (content, maxLength = 100) => {
    if (!content) return "";
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "...";
  };

  // posts가 null일 경우 빈 배열로 처리
  const safePostsArray = Array.isArray(posts) ? posts : [];

  // 이미지 URL 정규화 함수
  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "/images/blank_img.png";

    // 이미 절대 URL인 경우 그대로 반환
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }

    // 상대 URL인 경우 '/'를 앞에 추가
    return `/${url}`;
  };

  if (loading) {
    return <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>게시판 정보를 불러오는 중...</p>
    </div>;
  }

  if (dataLoaded && posts.length === 0) {
    return <div className="empty-posts-container">
      <div className="branch-board-container">
        
      <h1 className="board-title">지부 공지사항</h1>
      <div className="board_empty">
      <div className="empty-posts-icon">📭</div>
      <p className="empty-posts-message">등록된 게시글이 없습니다.</p>
      <p className="empty-posts-submessage">첫 번째 게시물을 작성해보세요!</p>
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
      <h1 className="board-title">지부 공지사항</h1>

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
                                src={normalizeImageUrl(post.images[0])}
                                alt={`${post.title || "게시물"} 이미지`}
                                className="post-thumbnail"
                                onError={(e) => {
                                e.target.src = "/images/blank_img.png";
                                e.target.classList.add("blank");
                            }}
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
            <td  className="post-title">
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
                {post.views || 0}
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
            onClick={() => handlePageChange(1)} // 첫 페이지로
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
            onClick={() => handlePageChange(currentPage + 2)} // UI 페이지 = 내부인덱스 + 1 + 1
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default NoticeBoardList; 
