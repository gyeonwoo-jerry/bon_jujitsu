import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import BoardWrite from '../components/BoardWrite';

function NewsWrite() {
  const [pageName, setPageName] = useState('');
  const location = useLocation();
  
  // 수정 모드일 때 API 엔드포인트 정보 가져오기
  const apiEndpoint = location.state?.apiEndpoint || '/news';

  useEffect(() => {
    const title = '뉴스 작성';
    setPageName(title);
    document.title = title;
  }, []);

  return (
    <div className="newsWrite">
      <SubHeader pageName={pageName} />
      <BoardWrite 
        apiEndpoint={apiEndpoint}
        title="뉴스 작성" 
      />
    </div>
  );
}

export default NewsWrite; 