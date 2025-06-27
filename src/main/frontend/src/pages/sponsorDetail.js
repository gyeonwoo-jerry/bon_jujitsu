import React, { useEffect, useState } from 'react';  
import { useLocation, useParams } from 'react-router-dom';
import SponsorDetail from '../components/PostDetail';
import SubHeader from '../components/SubHeader';

function SponsorDetailPage() {
  const [pageName, setPageName] = useState('제휴업체 상세');
  const [descName, setDescName] = useState('');
  const location = useLocation();
  const params = useParams();
  const { id } = useParams(); // URL에서 ID 파라미터를 직접 추출
  
  const apiEndpoint = location.state?.apiEndpoint || '/sponsor';

  // 디버깅 로그 추가
  useEffect(() => {
    console.log('SponsorDetail - URL params:', params);
    console.log('SponsorDetail - ID:', id);
    console.log('SponsorDetail - Location:', location);
  }, [params, id, location]);

  // SponsorDetail 컴포넌트에서 제휴업체 제목을 받아오는 콜백 함수
  const handleSponsorTitleChange = (title) => {
    if (title) {
      setPageName(title);
      setDescName('본주짓수와 함께하는 제휴업체입니다.');
      document.title = `${title} - 제휴업체 상세`;
    }
  };

  useEffect(() => {
    // 초기 로딩 상태에서는 기본 타이틀 사용
    setPageName('제휴업체 상세');
    setDescName('본주짓수 제휴업체를 확인해보세요.');
    document.title = '제휴업체 상세';
  }, [id]); // id가 변경될 때마다 리셋

  return (
    <div className="sponsorDetail">
      <SubHeader pageName={pageName} descName={descName} />
      <SponsorDetail 
        apiEndpoint={apiEndpoint} 
        onPostLoad={handleSponsorTitleChange} 
      />
    </div>
  );
}

export default SponsorDetailPage; 