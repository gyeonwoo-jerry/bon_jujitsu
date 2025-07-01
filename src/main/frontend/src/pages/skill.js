import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import PostList from '../components/PostList';
import '../styles/skill.css'; // 스타일 파일이 없다면 생성해야 합니다

function Skill() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canWriteSkill, setCanWriteSkill] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const title = '기술';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수의 기초 기술들을 배워 보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);

    // 스킬 작성 권한 확인 (PostWrite와 동일한 로직)
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

    checkSkillWritePermission();
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

    if (!canWriteSkill) {
      alert('스킬 게시물은 관장이나 관리자만 작성할 수 있습니다.');
      return;
    }

    // 새로운 PostWrite 스킬 라우트로 이동
    navigate('/write/skill');
  };

  return (
      <div className="skill">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="skill-container">
          <div className="inner">
            <div className="section_title">BON <font className='thin small'>in</font> SKILL</div>
            <PostList
                apiEndpoint="/skill"
                title=""
                searchPlaceholder="기술명으로 검색..."
                pageSize={12}
            />
            {canWriteSkill && (
                <button
                    className="write-button"
                    onClick={handleWriteClick}
                >
                  글쓰기
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

export default Skill;