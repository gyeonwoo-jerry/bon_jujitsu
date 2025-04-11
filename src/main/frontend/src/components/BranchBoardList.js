import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchBoardList.css";

const BranchBoardList = ({ title = "지점 게시판" }) => {
  // URL 파라미터에서 브랜치 ID 직접 가져오기 (/branches/:branchId)
  const { branchId } = useParams();
  const navigate = useNavigate();
  
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0); // 페이지 인덱스 0부터 시작
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // API 엔드포인트 설정
  const apiEndpoint = '/board';

  // useCallback을 사용하여 fetchPosts 함수를 메모이제이션
  const fetchPosts = useCallback((page) => {
    // branchId가 없으면 API 호출을 하지 않음
    if (!branchId) {
      setLoading(false);
      setError('지점 ID가 필요합니다. 올바른 지점 페이지로 이동해주세요.');
      return;
    }

    setLoading(true);
    console.log(`API 요청: ${apiEndpoint}?page=${page}&size=${pageSize}&branchId=${branchId}`);

    // 인증 토큰 확인
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    API.get(`${apiEndpoint}?page=${page}&size=${pageSize}&branchId=${branchId}`, { headers })
      .then((response) => {
        if (response.status === 200) {
          console.log("Posts fetched:", response.data);
          if (response.data.success) {
            setPosts(response.data.content.list || []);
            setTotalPages(response.data.content.totalPage || 1);
          } else {
            setPosts([]);
            setError(response.data.message || '게시물을 불러올 수 없습니다.');
          }
        }
      })
      .catch((error) => {
        console.error('게시판 목록 가져오기 오류:', error);
        if (error.response) {
          // 서버에서 응답이 왔지만 오류 코드가 있는 경우
          if (error.response.status === 401) {
            setError('로그인이 필요합니다.');
          } else if (error.response.status === 403) {
            setError('접근 권한이 없습니다.');
          } else {
            setError(`게시판 정보를 불러올 수 없습니다. (${error.response.status})`);
          }
        } else if (error.request) {
          // 요청은 전송되었지만 응답을 받지 못한 경우
          setError('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
        } else {
          // 오류를 발생시킨 요청을 설정하는 중에 문제가 발생한 경우
          setError('요청 중 오류가 발생했습니다.');
        }
        setPosts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiEndpoint, pageSize, branchId]);

  useEffect(() => {
    document.title = branchId ? `${title} - 지점 ${branchId}` : title;
    
    // branchId가 있을 때만 API 호출
    if (branchId) {
      console.log("브랜치 ID 감지됨:", branchId);
      fetchPosts(currentPage);
    } else {
      setLoading(false);
      setError('지점 정보가 없습니다. URL을 확인해주세요.');
    }
  }, [branchId, currentPage, fetchPosts, title]);

  const handlePostClick = (id) => {
    if (!id) {
      console.error("유효하지 않은 게시물 ID입니다");
      return;
    }
    navigate(`/branches/${branchId}/board/${id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page - 1); // UI는 1부터 시작하지만 API는 0부터 시작
  };

  // 페이지 번호 배열 생성 (1부터 시작하는 번호로 표시)
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

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
    if (!url) return "/images/blank_img.png";

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

  if (error) {
    return <div className="error-container">
      <p className="error-message">{error}</p>
      {branchId && (
        <button className="retry-button" onClick={() => fetchPosts(currentPage)}>
          다시 시도
        </button>
      )}
    </div>;
  }

  if (safePostsArray.length === 0) {
    return <div className="empty-posts-container">
      <div className="empty-posts-icon">📭</div>
      <p className="empty-posts-message">등록된 게시글이 없습니다.</p>
      <p className="empty-posts-submessage">첫 번째 게시물을 작성해보세요!</p>
    </div>;
  }

  return (
    <div className="branch-board-container">
      <h1 className="board-title">{title}</h1>

      <div className="board-list">
        {safePostsArray.map((post) => (
          <div
            key={post.id || `post-${Math.random()}`}
            className="post-item"
            onClick={() => post.id && handlePostClick(post.id)}
          >
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
            <div className="post-contents">
              <div className="post-header">
                <h2 className="post-title">{post.title || "제목 없음"}</h2>
                <span className={`post-region ${!post.region ? "display_none" : ""}`}>
                  {post.region || ""}
                </span>
              </div>
              <div className="post-desc">{truncateContent(post.content)}</div>
              <div className="post-footer">
                <span className="post-author">{post.writer || post.name || "작성자 없음"}</span>
                <span className="post-date">
                  {post.date || (post.createdAt 
                    ? new Date(post.createdAt).toLocaleDateString() 
                    : "날짜 정보 없음")}
                </span>
                <span className="post-views">조회 {post.views || 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            disabled={currentPage === 0} // 0이 첫 페이지
            onClick={() => handlePageChange(currentPage)} // 현재 페이지 - 1 + 1 = 현재 페이지
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
            disabled={currentPage === totalPages - 1} // 마지막 페이지 인덱스는 totalPages - 1
            onClick={() => handlePageChange(currentPage + 2)} // 현재 페이지 + 1 + 1 = 현재 페이지 + 2
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default BranchBoardList; 
