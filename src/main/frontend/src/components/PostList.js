import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';
import '../styles/postList.css';

const PostList = ({
  apiEndpoint,
  title = "게시글 목록",
  detailPathPrefix = "/post",
  branchId = null,
  showRegion = false,
  searchPlaceholder = "제목으로 검색...",
  pageSize = 12
}) => {
  const navigate = useNavigate();
  const safeNavigate = loggedNavigate(navigate);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title'); // title, author, content

  useEffect(() => {
    fetchPosts();
  }, [currentPage, apiEndpoint]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      // Spring Boot가 1-based 페이지를 받으므로 currentPage를 그대로 전송
      const params = new URLSearchParams({
        page: currentPage.toString(), // UI는 1부터 시작, 서버도 1부터 시작
        size: pageSize.toString()
      });

      // 검색 쿼리가 있을 때만 추가
      if (searchQuery.trim()) {
        if (searchType === 'title') {
          params.append('title', searchQuery.trim());
        } else if (searchType === 'author') {
          params.append('name', searchQuery.trim());
        } else if (searchType === 'content') {
          params.append('content', searchQuery.trim());
        }
      }

      // 지부 ID 관련 파라미터는 skill에서 사용하지 않으므로 제거
      // if (branchId) {
      //   params.append('branchId', branchId);
      // }

      const requestUrl = `${apiEndpoint}?${params.toString()}`;
      console.log('🔍 API 요청 URL:', requestUrl);
      console.log('🔍 현재 페이지:', currentPage);
      console.log('🔍 페이지 크기:', pageSize);

      const response = await API.get(requestUrl);

      console.log('📦 API 응답 전체:', response.data);
      console.log('✅ 응답 성공 여부:', response.data.success);
      console.log('📄 응답 메시지:', response.data.message);
      console.log('📋 응답 컨텐츠:', response.data.content);

      if (response.data.success) {
        const data = response.data.content;
        console.log('📊 데이터 구조:', data);

        // 서버 응답 구조에 따라 다르게 처리
        let posts = [];
        let totalPages = 0;
        let totalElements = 0;

        if (data.list) {
          // 스킬 API 응답 구조: { list: [], totalPage: 1, page: 1, size: 12 }
          posts = data.list;
          totalPages = data.totalPage || 0;
          totalElements = data.list.length; // 스킬 API에는 totalElements가 없으므로 현재 페이지 요소 수 사용
          console.log('📝 스킬 API 응답 - 게시글 개수:', posts.length);
        } else if (data.content) {
          // 일반 게시판 API 응답 구조: { content: [], totalPages: 1, totalElements: 5 }
          posts = data.content;
          totalPages = data.totalPages || 0;
          totalElements = data.totalElements || 0;
          console.log('📝 일반 API 응답 - 게시글 개수:', posts.length);
        } else {
          console.warn('⚠️ 알 수 없는 응답 구조:', data);
        }

        console.log('📏 설정된 게시글 개수:', posts.length);
        console.log('📄 전체 페이지:', totalPages);
        console.log('🔢 전체 요소:', totalElements);

        setPosts(posts);
        setTotalPages(totalPages);
        setTotalElements(totalElements);
      } else {
        console.error('❌ API 응답 실패:', response.data.message);
        setError(response.data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('💥 PostList 불러오기 오류:', err);
      console.error('💥 에러 응답:', err.response?.data);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // 검색 시 첫 페이지로
    fetchPosts();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCardClick = (post) => {
    if (!post.id) {
      console.error('게시글 ID가 없습니다:', post);
      return;
    }

    // 스킬 상세 페이지로 이동
    const detailPath = `/skillDetail/${post.id}`;
    console.log('상세 페이지 이동:', detailPath);
    safeNavigate(detailPath);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getCardClassName = () => {
    return "skill-card"; // skill 전용이므로 항상 skill-card 사용
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 페이지 버튼
    if (currentPage > 1) {
      pageNumbers.push(
          <button
              key="prev"
              onClick={() => handlePageChange(currentPage - 1)}
              className="pagination-button"
          >
            이전
          </button>
      );
    }

    // 페이지 번호들
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
          <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={`pagination-button ${currentPage === i ? 'active' : ''}`}
          >
            {i}
          </button>
      );
    }

    // 다음 페이지 버튼
    if (currentPage < totalPages) {
      pageNumbers.push(
          <button
              key="next"
              onClick={() => handlePageChange(currentPage + 1)}
              className="pagination-button"
          >
            다음
          </button>
      );
    }

    return (
        <div className="pagination-container">
          {pageNumbers}
        </div>
    );
  };

  if (loading) {
    return (
        <div className="post-list-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>게시글을 불러오는 중...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="post-list-container">
        {title && <h2 className="post-list-title">{title}</h2>}

        {/* 검색 기능 */}
        <div className="search-section">
          <form onSubmit={handleSearch} className="search-form">
            <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
                className="search-type-select"
            >
              <option value="title">제목</option>
              <option value="author">작성자</option>
              <option value="content">내용</option>
            </select>
            <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="search-input"
            />
            <button type="submit" className="search-button">
              검색
            </button>
          </form>
          {searchQuery && (
              <div className="search-info">
                <span>"{searchQuery}" 검색 결과: {totalElements}개</span>
                <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                      fetchPosts();
                    }}
                    className="clear-search-button"
                >
                  검색 초기화
                </button>
              </div>
          )}
        </div>

        {/* 오류 메시지 */}
        {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchPosts} className="retry-button">
                다시 시도
              </button>
            </div>
        )}

        {/* 게시글 목록 */}
        {posts.length > 0 ? (
            <>
              <div className="posts-grid">
                {posts.map((post) => (
                    <div
                        key={post.id}
                        className={getCardClassName()}
                        onClick={() => handleCardClick(post)}
                    >
                      {/* 카드 헤더 - 썸네일 이미지 */}
                      <div className="card-image">
                        {post.images && post.images.length > 0 ? (
                            <img
                                src={post.images[0].url}
                                alt={post.title}
                                onError={(e) => {
                                  e.target.src = '/images/blank_img.png'; // 기본 이미지
                                }}
                            />
                        ) : (
                            <div className="no-image">
                              <span>📄</span>
                            </div>
                        )}
                        {/* 이미지 개수 배지 */}
                        {post.images && post.images.length > 1 && (
                            <div className="image-count-badge">
                              +{post.images.length - 1}
                            </div>
                        )}
                      </div>

                      {/* 카드 내용 */}
                      <div className="card-content">
                        <h3 className="card-title">{post.title}</h3>
                        <p className="card-description">
                          {truncateText(post.content, 80)}
                        </p>

                        {/* 게시글 메타 정보 */}
                        <div className="card-meta">
                          <div className="meta-left">
                            <span className="author">👤 {post.author}</span>
                            {showRegion && post.region && (
                                <span className="region">📍 {post.region}</span>
                            )}
                          </div>
                          <div className="meta-right">
                            <span className="date">📅 {formatDate(post.createdAt)}</span>
                            <span className="views">👁 {post.viewCount?.toLocaleString()}</span>
                          </div>
                        </div>

                        {/* 수정 시간 표시 */}
                        {post.modifiedAt && post.modifiedAt !== post.createdAt && (
                            <div className="modified-info">
                              <small>✏️ 수정: {formatDate(post.modifiedAt)}</small>
                            </div>
                        )}
                      </div>

                      {/* 호버 효과 */}
                      <div className="card-overlay">
                        <span className="view-detail">자세히 보기 →</span>
                      </div>
                    </div>
                ))}
              </div>

              {/* 페이지네이션 */}
              {renderPagination()}

              {/* 총 게시글 수 정보 */}
              <div className="total-info">
                전체 {totalElements}개의 게시글 (페이지 {currentPage}/{totalPages})
              </div>
            </>
        ) : (
            <div className="no-posts">
              <div className="no-posts-icon">📝</div>
              <p>게시글이 없습니다.</p>
              {searchQuery && (
                  <p>다른 검색어로 시도해보세요.</p>
              )}
            </div>
        )}
      </div>
  );
};

export default PostList;