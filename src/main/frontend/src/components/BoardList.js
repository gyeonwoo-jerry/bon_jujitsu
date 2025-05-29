import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/boardList.css";

function BoardList({
  apiEndpoint = "/board",
  title = "게시판",
  detailPathPrefix = "/board",
}) {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // API 엔드포인트 확인 및 정규화
  const normalizedApiEndpoint = apiEndpoint || "/board";

  // useCallback을 사용하여 fetchPosts 함수를 메모이제이션
  const fetchPosts = useCallback(
    (page) => {
      setLoading(true);
      console.log(
        `API 요청: ${normalizedApiEndpoint}?page=${page}&size=${pageSize}`
      );

      API.get(`${normalizedApiEndpoint}?page=${page}&size=${pageSize}`)
        .then((response) => {
          if (response.status === 200) {
            console.log("Posts fetched:", response.data);
            if (response.data.success) {
              setPosts(response.data.content.list || []);
              setTotalPages(response.data.content.totalPage || 1);
            } else {
              console.error("API 응답 오류:", response.data.message);
              setError(response.data.message || "데이터를 불러올 수 없습니다.");
              setPosts([]);
            }
          }
        })
        .catch((error) => {
          console.error("API 호출 오류:", error);
          if (error.response) {
            if (error.response.status === 500) {
              setError("서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            } else if (error.response.status === 404) {
              setError("요청한 페이지를 찾을 수 없습니다.");
            } else if (error.response.data && error.response.data.message) {
              setError(error.response.data.message);
            } else {
              setError(`서버 오류 (${error.response.status}): 데이터를 불러올 수 없습니다.`);
            }
          } else if (error.request) {
            setError("네트워크 연결을 확인해주세요.");
          } else {
            setError("요청 처리 중 오류가 발생했습니다.");
          }
          setPosts([]);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [normalizedApiEndpoint, pageSize]
  );

  useEffect(() => {
    document.title = title || "게시판";
    fetchPosts(currentPage);
  }, [currentPage, title, fetchPosts]);

  const handlePostClick = (id) => {
    // ID 유효성 검사 강화
    if (!id || id === 'undefined' || id === undefined || id === null) {
      console.error("유효하지 않은 게시물 ID입니다:", id);
      alert("게시물 정보가 올바르지 않습니다.");
      return;
    }

    // 상세 페이지 경로 정규화
    const normalizedDetailPath = detailPathPrefix || "/board";
    navigate(`${normalizedDetailPath}/${id}`);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 페이지 번호 배열 생성
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
    if (!url || typeof url !== 'string') return "/images/blank_img.png";

    // 이미 절대 URL인 경우 그대로 반환
    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("/")
    ) {
      return url;
    }

    // 상대 URL인 경우 '/'를 앞에 추가
    return `/${url}`;
  };

  return (
    <div className="board-container">
      

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>게시물을 불러오는 중...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button
            className="retry-button"
            onClick={() => fetchPosts(currentPage)}
          >
            다시 시도
          </button>
        </div>
      ) : safePostsArray.length === 0 ? (
        <div className="empty-posts-container">
          <div className="empty-posts-icon">📭</div>
          <p className="empty-posts-message">게시물이 없습니다.</p>
          <p className="empty-posts-submessage">
            첫 번째 게시물을 작성해보세요!
          </p>
        </div>
      ) : (
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
                  <span
                    className={`post-region ${
                      !post.region ? "display_none" : ""
                    }`}
                  >
                    {post.region || ""}
                  </span>
                </div>
                <div className="post-desc">{truncateContent(post.content)}</div>
                <div className="post-footer">
                  <span className="post-author">
                    {post?.owner?.name || post.name || "작성자 없음"}
                  </span>
                  <span className="post-date">
                    {post.createdAt
                      ? new Date(post.createdAt).toLocaleDateString()
                      : "날짜 정보 없음"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && safePostsArray.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-button"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            이전
          </button>

          {pageNumbers.map((number) => (
            <button
              key={number}
              className={`pagination-number ${
                currentPage === number ? "active" : ""
              }`}
              onClick={() => handlePageChange(number)}
            >
              {number}
            </button>
          ))}

          <button
            className="pagination-button"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

export default BoardList;
