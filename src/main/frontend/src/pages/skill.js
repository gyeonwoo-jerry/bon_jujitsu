import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import BoardList from '../components/BoardList';
import '../styles/skill.css'; // 스타일 파일이 없다면 생성해야 합니다

function Skill() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => { 
    const title = '기술';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수의 기초 기술들을 배워 보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);

    // 사용자 권한 확인
    const checkUserRole = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setIsAdmin(userInfo.role === 'ADMIN');
        }
      } catch (error) {
        console.error('사용자 권한 확인 오류:', error);
        setIsAdmin(false);
      }
    };
    checkUserRole();
  }, []);

  const handleWriteClick = () => {
    navigate('/skillWrite');
  };

  return (
    <div className="skill">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className="skill-container">
        <div className="inner">
            <div className="section_title">BON <font className='thin small'>in</font> SKILL</div>
            <BoardList
              apiEndpoint="/skill"
              title=""
              detailPathPrefix="/skillDetail"
            />
            {isAdmin && (
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