import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import StoreWrite from '../components/StoreWrite';
import '../styles/storeWrite.css'; // 스타일 파일이 없다면 생성해야 합니다

function StoreWritePage() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => { 
    const title = '상품 등록';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수는 다양한 지역에서 활동하고 있습니다.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);
    
    // 로컬 스토리지에서 userInfo 정보 확인
    try {
      const userInfoStr = localStorage.getItem('userInfo');
      console.log('로컬 스토리지의 userInfo:', userInfoStr);
      
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        console.log('파싱된 사용자 정보:', userInfo);
        
        const userRole = userInfo.role;
        console.log('사용자 권한:', userRole);
        
        const hasAdminRole = 
          userRole?.toUpperCase() === 'ADMIN' || 
          userRole?.toUpperCase() === 'OWNER';
        
        setIsAdmin(hasAdminRole);
        
        // 관리자가 아니면 스토어 메인으로 리다이렉트
        if (!hasAdminRole) {
          alert('관리자만 접근할 수 있는 페이지입니다.');
          navigate('/store');
        }
      } else {
        console.log('로컬 스토리지에 userInfo 정보가 없습니다.');
        alert('로그인이 필요한 서비스입니다.');
        navigate('/store');
      }
    } catch (error) {
      console.error('사용자 정보 확인 오류:', error);
      navigate('/store');
    }
  }, [navigate]);

  return (
    <div className="storeWrite">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className="storeWrite-container">
        <div className="inner">
            <div className="section_title">상품 등록</div>
            {isAdmin && <StoreWrite />}
        </div>
      </div>
    </div>
  );
}

export default StoreWritePage; 