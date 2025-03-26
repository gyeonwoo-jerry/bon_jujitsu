import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import BoardList from '../components/BoardList';
import '../styles/news.css'; // 스타일 파일이 없다면 생성해야 합니다

function News() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => { 
    const title = '뉴스';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수는 다양한 지역에서 활동하고 있습니다.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);
  }, []);

  const handleWriteClick = () => {
    navigate('/newsWrite');
  };

  return (
    <div className="news">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className="news-container">
        <div className="news-header">
          <h1 className="news-title">뉴스</h1>
          <button 
            className="write-button"
            onClick={handleWriteClick}
          >
            글쓰기
          </button>
        </div>
        <BoardList
          apiEndpoint="/news"
          title=""
          detailPathPrefix="/newsDetail"
        />
      </div>
    </div>
  );
}

export default News; 