import React, { useEffect, useState } from 'react';  
import { useLocation, useParams } from 'react-router-dom';
import SkillDetail from '../components/BoardDetail';
import SubHeader from '../components/SubHeader';

function SkillDetailPage() {
  const [pageName, setPageName] = useState('기술 상세');
  const [descName, setDescName] = useState('');
  const location = useLocation();
  const params = useParams();
  const { id } = useParams(); // URL에서 ID 파라미터를 직접 추출
  
  const apiEndpoint = location.state?.apiEndpoint || '/skill';

  // 디버깅 로그 추가
  useEffect(() => {
    console.log('SkillDetail - URL params:', params);
    console.log('SkillDetail - ID:', id);
    console.log('SkillDetail - Location:', location);
  }, [params, id, location]);

  // NewsDetail 컴포넌트에서 뉴스 제목을 받아오는 콜백 함수
  const handleSkillTitleChange = (title) => {
    if (title) {
      setPageName(title);
      setDescName('본주짓수의 기본 기술을 알려 드립니다.');
      document.title = `${title} - 기술 상세`;
    }
  };

  useEffect(() => {
    // 초기 로딩 상태에서는 기본 타이틀 사용
    setPageName('기술 상세');
    setDescName('본주짓수 기술을 확인해보세요.');
    document.title = '기술 상세';
  }, [id]); // id가 변경될 때마다 리셋

  return (
    <div className="skillDetail">
      <SubHeader pageName={pageName} descName={descName} />
      <SkillDetail 
        apiEndpoint={apiEndpoint} 
        onPostLoad={handleSkillTitleChange} 
      />
    </div>
  );
}

export default SkillDetailPage; 