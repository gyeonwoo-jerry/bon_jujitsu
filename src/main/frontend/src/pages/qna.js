import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import BoardList from '../components/BoardList';
import '../styles/qna.css'; // 스타일 파일이 없다면 생성해야 합니다

function Qna() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => { 
    const title = 'QnA';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수에 대한 궁금한 점을 질문해보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);

    // 사용자 로그인 상태 확인
    const checkUserAuth = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        if (userInfoStr && token) {
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error('사용자 인증 확인 오류:', error);
        setIsLoggedIn(false);
      }
    };
    checkUserAuth();
  }, []);

  const handleWriteClick = () => {
    navigate('/qnaWrite');
  };

  return (
    <div className="qna">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className="qna-container">
        <div className="inner">
            <div className="section_title">본주짓수 <font className='thin small'>Q&A</font></div>
            <BoardList
              apiEndpoint="/qna"
              title=""
              detailPathPrefix="/qnaDetail"
            />
            {isLoggedIn && (
              <button 
                className="write-button"
                onClick={handleWriteClick}
              >
                질문하기
              </button>
            )}
        </div>
      </div>
    </div>
  );
}

export default Qna; 