import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../components/SubHeader';
import { usePostList } from '../../hooks/usePostList';
import SearchSection from '../../components/common/SearchSection';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../styles/qna.css';
import '../../styles/postList.css';

function Qna() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  // PostList 로직을 usePostList 훅으로 대체
  const {
    posts,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    searchQuery,
    searchType,
    setSearchQuery,
    setSearchType,
    handleSearch,
    handlePageChange,
    clearSearch,
    navigate: postNavigate,
    fetchPosts
  } = usePostList('/qna', 12);

  useEffect(() => {
    const title = 'QnA';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수에 대한 궁금한 점을 질문해보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);
  }, []);

  const handleWriteClick = () => {
    navigate('/write/qna')
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

  const getQnaAuthor = (post) => {
    if (post.authorName) return post.authorName;
    if (post.guestName) return post.guestName;
    if (post.author) return post.author;
    return '익명';
  };

  const handleRowClick = (post) => {
    if (!post.id) {
      console.error('게시글 ID가 없습니다:', post);
      return;
    }
    postNavigate(`/detail/qna/${post.id}`);
  };

  return (
      <div className="qna">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="qna-container">
          <div className="inner">
            <div className="section_title">본주짓수 <font className='thin small'>Q&A</font></div>

            {/* 기존 PostList 대신 직접 구현 */}
            <div className="post-list-container">
              <SearchSection
                  searchQuery={searchQuery}
                  searchType={searchType}
                  onSearchQueryChange={setSearchQuery}
                  onSearchTypeChange={setSearchType}
                  onSearch={handleSearch}
                  totalElements={totalElements}
                  onClearSearch={clearSearch}
                  placeholder="Q&A 검색..."
              />

              {loading && <LoadingSpinner message="Q&A를 불러오는 중..." />}
              {error && <ErrorMessage message={error} onRetry={fetchPosts} />}

              {posts.length > 0 ? (
                  <>
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
                                onClick={() => handleRowClick(post)}
                            >
                              <td className="status-cell">
                            <span className={`status-badge ${post.hasAnswer ? 'answered' : 'waiting'}`}>
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
                              <td className="author-cell">{getQnaAuthor(post)}</td>
                              <td className="date-cell">{formatDate(post.createdAt)}</td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />

                    <div className="total-info">
                      전체 {totalElements}개의 질문 (페이지 {currentPage}/{totalPages})
                    </div>
                  </>
              ) : (
                  <div className="no-posts">
                    <div className="no-posts-icon">❓</div>
                    <p>질문이 없습니다.</p>
                    {searchQuery && <p>다른 검색어로 시도해보세요.</p>}
                  </div>
              )}
            </div>

            {/* QnA는 로그인 여부와 상관없이 누구나 질문할 수 있으므로 항상 버튼 표시 */}
            <button className="write-button" onClick={handleWriteClick}>
              질문하기
            </button>
          </div>
        </div>
      </div>
  );
}

export default Qna;