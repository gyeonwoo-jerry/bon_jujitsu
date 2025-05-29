import React, { useEffect, useState } from 'react';  
import { useLocation, useParams } from 'react-router-dom';
import QnaDetail from '../components/BoardDetail';
import SubHeader from '../components/SubHeader';

function QnaDetailPage() {
  const [pageName, setPageName] = useState('질문 상세');
  const [descName, setDescName] = useState('');
  const location = useLocation();
  const params = useParams();
  const { id } = useParams(); // URL에서 ID 파라미터를 직접 추출
  
  const apiEndpoint = location.state?.apiEndpoint || '/qna';

  // 디버깅 로그 추가
  useEffect(() => {
    console.log('QnaDetail - URL params:', params);
    console.log('QnaDetail - ID:', id);
    console.log('QnaDetail - Location:', location);
  }, [params, id, location]);

  // QnaDetail 컴포넌트에서 질문 제목을 받아오는 콜백 함수
  const handleQnaTitleChange = (title) => {
    if (title) {
      setPageName(title);
      setDescName('본주짓수에 대한 질문과 답변입니다.');
      document.title = `${title} - 질문 상세`;
    }
  };

  useEffect(() => {
    // 초기 로딩 상태에서는 기본 타이틀 사용
    setPageName('질문 상세');
    setDescName('본주짓수 Q&A를 확인해보세요.');
    document.title = '질문 상세';
  }, [id]); // id가 변경될 때마다 리셋

  return (
    <div className="qnaDetail">
      <SubHeader pageName={pageName} descName={descName} />
      <QnaDetail 
        apiEndpoint={apiEndpoint} 
        onPostLoad={handleQnaTitleChange} 
      />
    </div>
  );
}

export default QnaDetailPage; 