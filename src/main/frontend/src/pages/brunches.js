import React, { useEffect, useState } from 'react';  
import BranchList from '../components/BranchList';
import SubHeader from '../components/SubHeader';

function Brunches() {
  const [pageName, setPageName] = useState('');
  useEffect(() => {
    const title = '지부 소개';
    setPageName(title);
    document.title = title;
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