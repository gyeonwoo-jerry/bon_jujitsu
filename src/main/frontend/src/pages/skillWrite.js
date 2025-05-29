import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import SkillWrite from '../components/SkillWrite';

function SkillWritePage() {
  const [pageName, setPageName] = useState('');
  const location = useLocation();
  const { id } = useParams(); // URL에서 ID 파라미터 가져오기
  const navigate = useNavigate();
  
  // 기술 작성용 API 엔드포인트 설정
  // 수정 모드일 때 API 엔드포인트 정보 가져오기
  const apiEndpoint = '/skill'; // 항상 '/skill'로 설정
  
  // 페이지 제목 설정 (수정 모드인지 여부에 따라)
  useEffect(() => {
    const title = id ? '기술 수정' : '기술 작성';   
    setPageName(title);
    document.title = title;
  }, [id]);

  // 사용자 인증 상태 확인
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      // 필요한 경우 사용자 로그인 페이지로 리디렉션
      // navigate('/login', { state: { redirectTo: location.pathname } });
      console.log('사용자 정보가 없습니다. 기본값(14)이 사용됩니다.');
    }
  }, []);

  return (
    <div className="skillWrite">
      <SubHeader pageName={pageName} />
      <SkillWrite 
        apiEndpoint={apiEndpoint}
        title={id ? '기술 수정' : '기술 작성'} 
      />
    </div>
  );
}

export default SkillWritePage; 