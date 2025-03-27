import React, { useState, useEffect } from 'react';
import SubHeader from '../components/SubHeader';
import StoreList from '../components/StoreList';

function Store() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    const title = '스토어'; 
    setPageName(title);
    document.title = title;
    const descName = 'BON JIU JITSU STORE';
    setDescName(descName);
    const backgroundImage = '/images/store_back.png';
    setBackgroundImage(backgroundImage);
  }, []);

  return (
    <div className="store">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className='store_container'>
        <StoreList />
      </div>
    </div>
  );
}

export default Store; 