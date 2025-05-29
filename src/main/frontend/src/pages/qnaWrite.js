import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import QnaWrite from '../components/QnaWrite';

function QnaWritePage() {
  const [pageName, setPageName] = useState('');
  const location = useLocation();
  const { id } = useParams(); // URL에서 ID 파라미터 가져오기
  const navigate = useNavigate();
  
  // 질문 작성용 API 엔드포인트 설정
  // 수정 모드일 때 API 엔드포인트 정보 가져오기
  const apiEndpoint = '/qna'; // 항상 '/qna'로 설정
  
  // 페이지 제목 설정 (수정 모드인지 여부에 따라)
  useEffect(() => {
    const title = id ? '질문 수정' : '질문 작성';   
    setPageName(title);
    document.title = title;
  }, [id]);

  // 사용자 인증 상태 확인
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    if (!userInfo || !token) {
      alert('로그인이 필요합니다.');
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="qnaWrite">
      <SubHeader pageName={pageName} />
      <QnaWrite 
        apiEndpoint={apiEndpoint}
        title={id ? '질문 수정' : '질문 작성'} 
      />
    </div>
  );
}

export default QnaWritePage; 