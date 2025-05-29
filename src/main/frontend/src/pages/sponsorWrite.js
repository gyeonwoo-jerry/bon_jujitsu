import React, { useEffect, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import SubHeader from '../components/SubHeader';
import SponsorWrite from '../components/SponsorWrite';

function SponsorWritePage() {
  const [pageName, setPageName] = useState('');
  const location = useLocation();
  const { id } = useParams(); // URL에서 ID 파라미터 가져오기
  const navigate = useNavigate();
  
  // 제휴업체 작성용 API 엔드포인트 설정
  // 수정 모드일 때 API 엔드포인트 정보 가져오기
  const apiEndpoint = '/sponsor'; // 항상 '/sponsor'로 설정
  
  // 페이지 제목 설정 (수정 모드인지 여부에 따라)
  useEffect(() => {
    const title = id ? '제휴업체 수정' : '제휴업체 등록';   
    setPageName(title);
    document.title = title;
  }, [id]);

  // 사용자 인증 상태 확인 (관리자만 가능)
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    const token = localStorage.getItem('token');
    
    if (!userInfo || !token) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userInfo);
      if (user.role !== 'ADMIN') {
        alert('관리자만 제휴업체를 등록할 수 있습니다.');
        navigate('/');
      }
    } catch (error) {
      console.error('사용자 정보 확인 오류:', error);
      alert('사용자 정보를 확인할 수 없습니다.');
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="sponsorWrite">
      <SubHeader pageName={pageName} />
      <SponsorWrite 
        apiEndpoint={apiEndpoint}
        title={id ? '제휴업체 수정' : '제휴업체 등록'} 
      />
    </div>
  );
}

export default SponsorWritePage; 