import React, { useEffect } from 'react';  
import ImageSlider from '../components/ImageSlider';
import NewsLatest from '../components/NewsLatest';


function Home() { 

  useEffect(() => {
    const title = '본주짓수';
    document.title = title;

  }, []);
  
  return (
    <div className="home">
      <ImageSlider />
      <NewsLatest />
      <section className='branch'>
        <div className='latest_branch_title'>
          본주짓수 지점
        </div>
        <div className='latest_branch_content'>
          본주짓수 지점은 본주짓수 지점입니다.
        </div>
      </section>
    </div>
  );
}

export default Home; 