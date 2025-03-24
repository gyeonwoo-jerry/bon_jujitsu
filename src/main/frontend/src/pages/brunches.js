import React, { useEffect, useState } from 'react';  
import BranchList from '../components/BranchList';
import SubHeader from '../components/SubHeader';

function Brunches() {
  const [pageName, setPageName] = useState('');
  useEffect(() => {
    // 페이지명을 저장 (예: "브랜치 페이지")
    setPageName('지부 소개');
  }, []);

  return (
    <div className="brunches">
      <SubHeader pageName={pageName} />
      <h1>환영합니다!</h1>
      <p>이것은 지부소개입니다.</p>
      <BranchList />
    </div>
  );
}

export default Brunches; 