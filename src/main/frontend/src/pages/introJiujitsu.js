import React, { useEffect, useState } from 'react';
import SubHeader from '../components/SubHeader';
import TabMenu from '../components/TabMenu';



function IntroJiujitsu() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');

  useEffect(() => {
    const title = '브라질리언 주짓수란?';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수는 다양한 지역에서 활동하고 있습니다.';
    setDescName(descName);
    const backgroundImage = '/images/bon_academy_back@3x.png';
    setBackgroundImage(backgroundImage);
  }, []);

  return (
    <div className="academy">
      <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
      <div className='academy_container'>
        <TabMenu />
        <div className='academy_content'>
          <h1>브라질리언 주짓수란?</h1>
        </div>
      </div>
    </div>
  );
}

export default IntroJiujitsu; 