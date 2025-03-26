import React, { useState, useEffect } from 'react';
import SubHeader from '../components/SubHeader';

function Store() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    const title = '스토어'; 
    setPageName(title);
    document.title = title;
    const descName = '환영합니다!';
    setDescName(descName);
    const backgroundImage = '/images/bon_academy_back@3x.png';
    setBackgroundImage(backgroundImage);
  }, []);

  return (
    <div className="store">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className='store_container'>
        <h1>환영합니다!</h1>
        <p>이것은 스토어입니다.</p>
      </div>
    </div>
  );
}

export default Store; 