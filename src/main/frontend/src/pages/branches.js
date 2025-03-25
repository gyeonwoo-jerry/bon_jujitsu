import React, { useEffect, useState } from 'react';  
import BranchList from '../components/BranchList';
import SubHeader from '../components/SubHeader';

function Branches() {
  const [pageName, setPageName] = useState('');
  useEffect(() => {
    const title = '지부 소개';
    setPageName(title);
    document.title = title;
  }, []);

  return (
    <div className="brunches">
      <SubHeader pageName={pageName} />
      <BranchList />
    </div>
  );
}

export default Branches; 