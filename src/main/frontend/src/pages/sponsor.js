import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import PostList from '../components/PostList';
import '../styles/sponsor.css'; // 스타일 파일이 없다면 생성해야 합니다

function Sponsor() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => { 
    const title = '제휴업체';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수와 함께하는 제휴업체를 소개합니다.';
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
    navigate('/sponsorWrite');
  };

  return (
    <div className="sponsor">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className="sponsor-container">
        <div className="inner">
            <div className="section_title">BON <font className='thin small'>with</font> PARTNERS</div>
            <PostList
              apiEndpoint="/sponsor"
              title=""
              detailPathPrefix="/sponsorDetail"
            />
            {isAdmin && (
              <button 
                className="write-button"
                onClick={handleWriteClick}
              >
                제휴업체 등록
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

export default Sponsor; 