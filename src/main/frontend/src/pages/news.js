import React, { useEffect, useState } from 'react';
import SubHeader from '../components/SubHeader';
import BoardList from '../components/BoardList';

function News() {
  const [pageName, setPageName] = useState('');
  useEffect(() => { 
    const title = '뉴스';
    setPageName(title);
    document.title = title;
  }, []);

  return (
    <div className="news">
      <SubHeader pageName={pageName} />
      <BoardList
        apiEndpoint="/news"
        title="뉴스"
        detailPathPrefix="/newsDetail"/>
    </div>
  );
}

export default News; 