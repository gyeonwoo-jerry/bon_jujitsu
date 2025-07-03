import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import { usePostList } from '../hooks/usePostList';
import SearchSection from '../components/common/SearchSection';
import PostCard from '../components/common/PostCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import '../styles/sponsor.css';
import '../styles/postList.css';

function Sponsor() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canWriteSponsor, setCanWriteSponsor] = useState(false);
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
  } = usePostList('/sponsor', 12);

  useEffect(() => {
    const title = '제휴업체';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수와 함께하는 제휴업체를 소개합니다.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);

    // 제휴업체 등록 권한 확인 (관리자만)
    const checkSponsorWritePermission = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (!userInfoStr) {
          setCanWriteSponsor(false);
          return;
        }

        const userInfo = JSON.parse(userInfoStr);
        console.log('제휴업체 페이지 권한 확인:', userInfo);

        // 관리자만 제휴업체 등록 가능
        if (userInfo.isAdmin === true) {
          console.log('✅ 관리자 권한으로 제휴업체 등록 허용');
          setCanWriteSponsor(true);
        } else {
          console.log('❌ 관리자 아님');
          setCanWriteSponsor(false);
        }
      } catch (error) {
        console.error('제휴업체 등록 권한 확인 오류:', error);
        setCanWriteSponsor(false);
      }
    };

    checkSponsorWritePermission();
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

    if (!canWriteSponsor) {
      alert('제휴업체 등록은 관리자만 가능합니다.');
      return;
    }

    // 제휴업체 등록 페이지로 이동
    navigate('/write/sponsor');
  };

  return (
      <div className="sponsor">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="sponsor-container">
          <div className="inner">
            <div className="section_title">BON <font className='thin small'>with</font> PARTNERS</div>

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
                  placeholder="제휴업체명으로 검색..."
              />

              {loading && <LoadingSpinner message="제휴업체 정보를 불러오는 중..." />}
              {error && <ErrorMessage message={error} onRetry={fetchPosts} />}

              {posts.length > 0 ? (
                  <>
                    <div className="posts-grid">
                      {posts.map((post) => (
                          <PostCard
                              key={post.id}
                              post={post}
                              type="sponsor"
                              onClick={() => postNavigate(`/detail/sponsor/${post.id}`)}
                              showRegion={true}
                          />
                      ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />

                    <div className="total-info">
                      전체 {totalElements}개의 제휴업체 (페이지 {currentPage}/{totalPages})
                    </div>
                  </>
              ) : (
                  <div className="no-posts">
                    <div className="no-posts-icon">🤝</div>
                    <p>등록된 제휴업체가 없습니다.</p>
                    {searchQuery && <p>다른 검색어로 시도해보세요.</p>}
                  </div>
              )}
            </div>

            {canWriteSponsor && (
                <button className="write-button" onClick={handleWriteClick}>
                  제휴업체 등록
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

export default Sponsor;