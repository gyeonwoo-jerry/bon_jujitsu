import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../../components/SubHeader';
import { usePostList } from '../../hooks/usePostList';
import SkillFilterSection from '../../components/SkillFilterSection';
import PostCard from '../../components/common/PostCard';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../styles/skill.css';
import '../../styles/postList.css';

function Skill() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canWriteSkill, setCanWriteSkill] = useState(false);

  // 필터 상태
  const [selectedPosition, setSelectedPosition] = useState('');
  const [selectedSkillType, setSelectedSkillType] = useState('');

  const navigate = useNavigate();

  // 기존 usePostList 훅 사용 (필터 파라미터 추가)
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
  } = usePostList('/skill', 12, {
    position: selectedPosition,
    skillType: selectedSkillType
  });

  useEffect(() => {
    const title = '기술';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수의 기초 기술들을 배워 보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);

    // 스킬 작성 권한 확인
    checkSkillWritePermission();
  }, []);

  // 필터 변경시 페이지를 1로 리셋하고 데이터 재로딩
  useEffect(() => {
    if (fetchPosts) {
      fetchPosts(1); // 첫 페이지로 리셋
    }
  }, [selectedPosition, selectedSkillType]);

  const checkSkillWritePermission = () => {
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      if (!userInfoStr) {
        setCanWriteSkill(false);
        return;
      }

      const userInfo = JSON.parse(userInfoStr);
      console.log('스킬 페이지 권한 확인:', userInfo);

      // 관리자는 스킬 작성 가능
      if (userInfo.isAdmin === true) {
        console.log('✅ 관리자 권한으로 스킬 작성 허용');
        setCanWriteSkill(true);
        return;
      }

      // 사용자의 지부 정보 확인 (어느 지부든 Owner 역할이 있으면 됨)
      if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
        const hasOwnerRole = userInfo.branchRoles.some(branchRole => {
          const role = branchRole.role;
          console.log(`역할 확인: ${role}`);
          return role === "OWNER";
        });

        console.log('✅ Owner 역할 보유 여부 (어느 지부든):', hasOwnerRole);
        setCanWriteSkill(hasOwnerRole);
      } else {
        console.log('❌ branchRoles 정보 없음');
        setCanWriteSkill(false);
      }
    } catch (error) {
      console.error('스킬 작성 권한 확인 오류:', error);
      setCanWriteSkill(false);
    }
  };

  const handleWriteClick = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    const isLoggedIn = !!(token || accessToken);

    if (!isLoggedIn) {
      alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!canWriteSkill) {
      alert('스킬 게시물은 관장이나 관리자만 작성할 수 있습니다.');
      return;
    }

    navigate('/write/skill');
  };

  const handlePositionChange = (position) => {
    setSelectedPosition(position);
  };

  const handleSkillTypeChange = (skillType) => {
    setSelectedSkillType(skillType);
  };

  const handleClearFilters = () => {
    setSelectedPosition('');
    setSelectedSkillType('');
  };

  const isFiltered = selectedPosition !== '' || selectedSkillType !== '';

  return (
      <div className="skill">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="skill-container">
          <div className="inner">
            <div className="section_title">BON <font className='thin small'>in</font> SKILL</div>

            <div className="post-list-container">
              {/* 스킬 필터 섹션 */}
              <SkillFilterSection
                  selectedPosition={selectedPosition}
                  selectedSkillType={selectedSkillType}
                  onPositionChange={handlePositionChange}
                  onSkillTypeChange={handleSkillTypeChange}
                  onClearFilters={handleClearFilters}
                  totalElements={totalElements}
                  isFiltered={isFiltered}
              />

              {loading && <LoadingSpinner message="기술 게시글을 불러오는 중..." />}
              {error && <ErrorMessage message={error} onRetry={fetchPosts} />}

              {posts.length > 0 ? (
                  <>
                    <div className="posts-grid">
                      {posts.map((post) => (
                          <PostCard
                              key={post.id}
                              post={post}
                              type="skill"
                              onClick={() => {
                                if (post?.id) {
                                  postNavigate(`/skill/${post.id}`);
                                }
                              }}
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
                      전체 {totalElements}개의 게시글 (페이지 {currentPage}/{totalPages})
                    </div>
                  </>
              ) : (
                  <div className="no-posts">
                    <div className="no-posts-icon">🥋</div>
                    <p>게시글이 없습니다.</p>
                    {isFiltered && <p>다른 필터 조건으로 시도해보세요.</p>}
                  </div>
              )}
            </div>

            {canWriteSkill && (
                <button className="write-button" onClick={handleWriteClick}>
                  글쓰기
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

export default Skill;