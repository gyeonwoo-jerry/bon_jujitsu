import React, { useEffect, useState } from 'react';  
import { useLocation, useParams } from 'react-router-dom';
import NewsDetail from '../components/BoardDetail';
import SubHeader from '../components/SubHeader';

function NewsDetailPage() {
  const [pageName, setPageName] = useState('뉴스 상세');
  const location = useLocation();
  const params = useParams();
  
  const apiEndpoint = location.state?.apiEndpoint || '/news';

  // NewsDetail 컴포넌트에서 뉴스 제목을 받아오는 콜백 함수
  const handleNewsTitleChange = (title) => {
    if (title) {
      setPageName(title);
      document.title = `${title} - 뉴스 상세`;
    }
  };

  useEffect(() => {
    // 초기 로딩 상태에서는 기본 타이틀 사용
    setPageName('뉴스 상세');
    document.title = '뉴스 상세';
  }, [params.newsId]); // 뉴스 ID가 변경될 때마다 리셋

  return (
    <div className="newsDetail">
      <SubHeader pageName={pageName} />
      <NewsDetail 
        apiEndpoint={apiEndpoint} 
        onPostLoad={handleNewsTitleChange} 
      />
    </div>
  );
}

export default NewsDetailPage; 