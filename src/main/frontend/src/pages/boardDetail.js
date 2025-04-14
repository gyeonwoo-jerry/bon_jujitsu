import React, { useEffect, useState } from 'react';  
import { useLocation, useParams } from 'react-router-dom';
import BoardDetail from '../components/BoardDetail';
import SubHeader from '../components/SubHeader';

function BoardDetailPage() {
  const [pageName, setPageName] = useState('게시글 상세');
  const location = useLocation();
  const params = useParams();
  
  // URL 경로에서 board 유형(notice, board 등)을 추출하여 apiEndpoint 결정
  const determineApiEndpoint = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    
    // URL 경로를 분석하여 3번째 항목(index 2) 추출
    // 예시: /branches/13/notice/3 => pathSegments = ['branches', '13', 'notice', '3']
    if (pathSegments.length >= 3) {
      const boardType = pathSegments[2]; // notice, board 등
      console.log(`URL에서 추출한 게시판 유형: ${boardType}`);
      
      // 추출한 게시판 유형에 따라 apiEndpoint 결정
      switch(boardType) {
        case 'notice':
          return '/notice';
        case 'board':
          return '/board';
        case 'news':
          return '/news';
        case 'event':
          return '/event';
        default:
          return '/board'; // 기본값
      }
    }
    
    // URL에서 추출 실패 시 location.state에서 확인하거나 기본값 사용
    return location.state?.apiEndpoint || '/board';
  };
  
  const apiEndpoint = determineApiEndpoint();
  console.log(`사용할 API 엔드포인트: ${apiEndpoint}`);

  // BoardDetail 컴포넌트에서 게시글 제목을 받아오는 콜백 함수
  const handlePostTitleChange = (title) => {
    if (title) {
      setPageName(title);
      document.title = `${title} - 게시글 상세`;
    }
  };

  useEffect(() => {
    // 초기 로딩 상태에서는 기본 타이틀 사용
    setPageName('게시글 상세');
    document.title = '게시글 상세';
  }, [params.boardId]); // 게시글 ID가 변경될 때마다 리셋

  return (
    <div className="boardDetail">
      <SubHeader pageName={pageName} />
      <BoardDetail 
        apiEndpoint={apiEndpoint} 
        onPostLoad={handlePostTitleChange} 
      />
    </div>
  );
}

export default BoardDetailPage; 