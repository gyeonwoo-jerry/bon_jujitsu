import React, { useEffect, useState } from 'react';  
import BranchList from '../components/BranchList';
import SubHeader from '../components/SubHeader';

function Branches() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    const title = '지부 소개';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수는 다양한 지역에서 활동하고 있습니다.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);
  }, []);

  return (
    <div className="brunches">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <BranchList />
    </div>
  );
}

export default Branches; 