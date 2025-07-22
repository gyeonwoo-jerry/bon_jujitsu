import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../components/SubHeader';
import { usePostList } from '../../hooks/usePostList';
import SearchSection from '../../components/common/SearchSection';
import PostCard from '../../components/common/PostCard';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../styles/news.css';
import '../../styles/postList.css';

function News() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canWriteNews, setCanWriteNews] = useState(false);
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
  } = usePostList('/news', 12);

  useEffect(() => {
    const title = '뉴스';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수는 다양한 지역에서 활동하고 있습니다.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);

    // 뉴스 작성 권한 확인 (관리자만)
    const checkNewsWritePermission = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          setCanWriteNews(false);
          return;
        }

        const userInfo = JSON.parse(userInfoStr);
        console.log('뉴스 페이지 권한 확인:', userInfo);

        // 관리자만 뉴스 작성 가능
        if (userInfo.isAdmin === true) {
          console.log('✅ 관리자 권한으로 뉴스 작성 허용');
          setCanWriteNews(true);
        } else {
          console.log('❌ 관리자 아님');
          setCanWriteNews(false);
        }
      } catch (error) {
        console.error('뉴스 작성 권한 확인 오류:', error);
        setCanWriteNews(false);
      }
    };

    checkNewsWritePermission();
  }, []);

  const handleWriteClick = () => {
    // 로그인 상태 확인
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    const isLoggedIn = !!(token || accessToken);

    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!canWriteNews) {
      alert('뉴스 게시물은 관리자만 작성할 수 있습니다.');
      return;
    }

    // PostWrite 통합 컴포넌트로 이동
    navigate('/write/news');
  };

  return (
      <div className="news">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="news-container">
          <div className="inner">
            <div className="section_title">BON <font className='thin small'>in</font> MEDIA</div>

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
                  placeholder="뉴스 검색..."
              />

              {loading && <LoadingSpinner message="뉴스를 불러오는 중..." />}
              {error && <ErrorMessage message={error} onRetry={fetchPosts} />}

              {posts.length > 0 ? (
                  <>
                    <div className="posts-grid">
                      {posts.map((post) => (
                          <PostCard
                              key={post.id}
                              post={post}
                              type="news"
                              onClick={() => postNavigate(`/news/${post.id}`)}
                              showRegion={false}
                          />
                      ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />

                    <div className="total-info">
                      전체 {totalElements}개의 뉴스 (페이지 {currentPage}/{totalPages})
                    </div>
                  </>
              ) : (
                  <div className="no-posts">
                    <div className="no-posts-icon">📰</div>
                    <p>뉴스가 없습니다.</p>
                    {searchQuery && <p>다른 검색어로 시도해보세요.</p>}
                  </div>
              )}
            </div>

            {canWriteNews && (
                <button className="write-button" onClick={handleWriteClick}>
                  글쓰기
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

export default News;