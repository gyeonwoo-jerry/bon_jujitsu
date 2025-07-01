// news.js 전체 수정된 버전:

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import PostList from '../components/PostList';
import '../styles/news.css';

function News() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [canWriteNews, setCanWriteNews] = useState(false);
  const navigate = useNavigate();

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
            <PostList
                apiEndpoint="/news"
                title=""
                searchPlaceholder="뉴스 검색..."
                pageSize={12}
                postType="news"
            />
            {canWriteNews && (
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

export default News;