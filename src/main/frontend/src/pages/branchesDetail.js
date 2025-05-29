import React, { useEffect, useState } from 'react';  
import BranchesDetail from '../components/BranchesDetail';

function BranchDetail() {
  const [pageName, setPageName] = useState('');
  useEffect(() => {
    const title = '지부 소개';
    setPageName(title);
    document.title = title;
  }, []);

  return (
    <div className="branchDetail">
      <BranchesDetail pageName={pageName}/>
    </div>
  );
}

export default BranchDetail; 