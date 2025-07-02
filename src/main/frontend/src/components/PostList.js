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
  pageSize = 12,
  postType = "skill" // skill, news, qna, sponsor 지원
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

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString()
      });

      if (searchQuery.trim()) {
        if (searchType === 'title') {
          params.append('title', searchQuery.trim());
        } else if (searchType === 'author') {
          params.append('name', searchQuery.trim());
        } else if (searchType === 'content') {
          params.append('content', searchQuery.trim());
        }
      }

      const requestUrl = `${apiEndpoint}?${params.toString()}`;
      const response = await API.get(requestUrl);

      if (response.data.success) {
        const data = response.data.content;
        let posts = [];
        let totalPages = 0;
        let totalElements = 0;

        if (data.list) {
          posts = data.list;
          totalPages = data.totalPage || 0;
          totalElements = data.list.length;
        }

        setPosts(posts);
        setTotalPages(totalPages);
        setTotalElements(totalElements);
      } else {
        setError(response.data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('PostList 불러오기 오류:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getDetailPath = (post) => {
    switch (postType) {
      case 'news':
        return `/detail/news/${post.id}`;
      case 'qna':
        return `/detail/qna/${post.id}`;
      case 'sponsor':
        return `/detail/sponsor/${post.id}`;
      case 'skill':
      default:
        return `/detail/skill/${post.id}`;
    }
  };

  const handlePostClick = (post) => {
    if (!post.id) {
      console.error('게시글 ID가 없습니다:', post);
      return;
    }
    const detailPath = getDetailPath(post);
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
    switch (postType) {
      case 'news':
        return "news-card";
      case 'sponsor':
        return "sponsor-card";
      case 'skill':
      default:
        return "skill-card";
    }
  };

  const getDefaultIcon = () => {
    switch (postType) {
      case 'news':
        return '📰';
      case 'qna':
        return '❓';
      case 'sponsor':
        return '🤝';
      case 'skill':
      default:
        return '🥋';
    }
  };

  const getQnaAuthor = (post) => {
    if (postType !== 'qna') return post.author;

    // 백엔드 authorName 필드 우선 사용
    if (post.authorName) {
      return post.authorName;
    }

    // fallback 로직
    if (post.guestName) {
      return post.guestName;
    }

    if (post.author) {
      return post.author;
    }

    return '익명';
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
              {/* QnA는 테이블 형태로 표시 */}
              {postType === 'qna' ? (
                  <div className="qna-table-container">
                    <table className="qna-table">
                      <thead>
                      <tr>
                        <th className="status-column">상태</th>
                        <th className="title-column">제목</th>
                        <th className="author-column">작성자</th>
                        <th className="date-column">작성일</th>
                      </tr>
                      </thead>
                      <tbody>
                      {posts.map((post) => (
                          <tr
                              key={post.id}
                              className="qna-row"
                              onClick={() => handlePostClick(post)}
                          >
                            <td className="status-cell">
                                <span className={`status-badge ${post.hasAnswer
                                    ? 'answered' : 'waiting'}`}>
                                  {post.hasAnswer ? '완료' : '대기'}
                                </span>
                            </td>
                            <td className="title-cell">
                              <div className="title-wrapper">
                                <span className="title-text">{post.title}</span>
                                {post.images && post.images.length > 0 && (
                                    <span className="image-icon">📷</span>
                                )}
                                {post.guestName && (
                                    <span className="guest-badge">비회원</span>
                                )}
                              </div>
                            </td>
                            <td className="author-cell">
                              {getQnaAuthor(post)}
                            </td>
                            <td className="date-cell">
                              {formatDate(post.createdAt)}
                            </td>
                          </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
              ) : (
                  /* skill, news, sponsor는 카드 형태로 표시 */
                  <div className="posts-grid">
                    {posts.map((post) => (
                        <div
                            key={post.id}
                            className={getCardClassName()}
                            onClick={() => handlePostClick(post)}
                        >
                          <div className="card-image">
                            {post.images && post.images.length > 0 ? (
                                <img
                                    src={post.images[0].url}
                                    alt={post.title}
                                    onError={(e) => {
                                      e.target.src = '/images/blank_img.png';
                                    }}
                                />
                            ) : (
                                <div className="no-image">
                                  <span>{getDefaultIcon()}</span>
                                </div>
                            )}
                            {post.images && post.images.length > 1 && (
                                <div className="image-count-badge">
                                  +{post.images.length - 1}
                                </div>
                            )}
                          </div>

                          <div className="card-content">
                            <h3 className="card-title">{post.title}</h3>
                            <p className="card-description">
                              {truncateText(post.content, 80)}
                            </p>

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

                            {post.modifiedAt && post.modifiedAt !== post.createdAt && (
                                <div className="modified-info">
                                  <small>✏️ 수정: {formatDate(post.modifiedAt)}</small>
                                </div>
                            )}

                            {/* 제휴업체 특별 정보 */}
                            {postType === 'sponsor' && post.url && (
                                <div className="sponsor-info">
                                  <span className="website">🌐 웹사이트</span>
                                </div>
                            )}
                          </div>

                          <div className="card-overlay">
                            <span className="view-detail">자세히 보기 →</span>
                          </div>
                        </div>
                    ))}
                  </div>
              )}

              {/* 페이지네이션 */}
              {renderPagination()}

              {/* 총 게시글 수 정보 */}
              <div className="total-info">
                전체 {totalElements}개의 {
                postType === 'qna' ? '질문' :
                    postType === 'sponsor' ? '제휴업체' : '게시글'
              } (페이지 {currentPage}/{totalPages})
              </div>
            </>
        ) : (
            <div className="no-posts">
              <div className="no-posts-icon">{getDefaultIcon()}</div>
              <p>{
                postType === 'qna' ? '질문이 없습니다.' :
                    postType === 'sponsor' ? '등록된 제휴업체가 없습니다.' : '게시글이 없습니다.'
              }</p>
              {searchQuery && (
                  <p>다른 검색어로 시도해보세요.</p>
              )}
            </div>
        )}
      </div>
  );
};

export default PostList;