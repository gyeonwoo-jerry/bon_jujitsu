import React, { useEffect, useState } from 'react';  
import { useLocation } from 'react-router-dom';
import NewsDetail from '../components/BoardDetail';

function NewsDetailPage() {
  const [pageName, setPageName] = useState('');
  const location = useLocation();
  
  const apiEndpoint = location.state?.apiEndpoint || '/news';

  useEffect(() => {
    const title = '뉴스 상세';
    setPageName(title);
    document.title = title;
  }, []);

  return (
    <div className="newsDetail">
      <NewsDetail apiEndpoint={apiEndpoint} />
    </div>
  );
}

export default NewsDetailPage; 