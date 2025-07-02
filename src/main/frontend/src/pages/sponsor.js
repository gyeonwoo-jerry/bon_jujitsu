import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import PostList from '../components/PostList';
import '../styles/sponsor.css'; // 스타일 파일이 없다면 생성해야 합니다

function Sponsor() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canWriteSponsor, setCanWriteSponsor] = useState(false);
  const navigate = useNavigate();

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
            <PostList
                apiEndpoint="/sponsor"
                title=""
                searchPlaceholder="제휴업체명으로 검색..."
                pageSize={12}
                postType="sponsor"
            />
            {canWriteSponsor && (
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