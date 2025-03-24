import React from 'react';
import ImageSlider from '../components/ImageSlider';
import NewsLatest from '../components/NewsLatest';


function Home() { 
  return (
    <div className="home">
      <ImageSlider />
      <NewsLatest />
      <section className='brunch'>
        <div className='latest_brunch_title'>
          본주짓수 지점
        </div>
        <div className='latest_brunch_content'>
          본주짓수 지점은 본주짓수 지점입니다.
        </div>
      </section>
    </div>
  );
}

export default Home; 