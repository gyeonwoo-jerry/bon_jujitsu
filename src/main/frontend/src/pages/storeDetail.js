import React, { useState, useEffect } from 'react';
import SubHeader from '../components/SubHeader';
import StoreDetail from '../components/StoreDetail';

function StoreDetailPage() {
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
    <div className="storeDetail">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className='store_container'>
        <div className="inner">
          <div className="section_title">본주짓수 <font className='thin small'>in</font> STORE</div>
          <StoreDetail />
        </div>
      </div>
    </div>
  );
}

export default StoreDetailPage; 