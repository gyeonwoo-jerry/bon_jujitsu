import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ImageSlider.css';
import { Link } from 'react-router-dom';

function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isFixed, setIsFixed] = useState(false);

  useEffect(() => {
      const handleScroll = () => {
          if (window.scrollY > 100) {
              setIsFixed(true);
          } else {
              setIsFixed(false);
          }
      };

      window.addEventListener('scroll', handleScroll);

      // Cleanup function to remove the event listener
      return () => {
          window.removeEventListener('scroll', handleScroll);
      };
  }, []);
  
  const images = [
    '',  // 이미지가 없을 때
    '../images/slide_01.png',
    '../images/slide_02.png',
  ];

  // useCallback을 사용하여 nextSlide 함수를 메모이제이션
  const nextSlide = useCallback(() => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  }, [images.length]);

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 3000);  // 3초마다 nextSlide 호출
    return () => clearInterval(interval);  // 컴포넌트 언마운트 시 타이머 정리
  }, [nextSlide]);  // nextSlide를 의존성 배열에 추가

  return (
    <div className={`slider-container ${isFixed ? 'fixed' : ''}`}>
      <div className="inner_ment">
        <div className="title">
          <div className="title_bold">BON jiu-jitsu</div>
          <div className="title_light">academy</div>
        </div>
        <div className="ment">
          <div className="ment_text">
            본주짓수는 히카르도 델라히바 선생님께
            블랙벨트로 인정을 받은 이정우 대표가 한국에 설립한 단체입니다.
            본주짓수는 국내에 브라질리언 주짓수를 발전시키는 데 이바지하였으며,
            국내 다양한 단체와 동반 성장, 인재 양성 등 지역 사회적 책임과
            성장을 함께 추구하고 있습니다.
          </div>
        </div>
        <div className="ment_button">
          <Link to="/academy">
            더 보기 +
          </Link>
        </div>
        <div className="network_button">
          <Link to="/branches">
            <div className='left_side'>
              <img src='../images/icon_bon.png' alt="network_button" />
              <div className='tit'>
                <div className='sub_tit'>
                  BON NETWORK
                </div>
                <div className='main_tit'>
                  본 주짓수 네트워크
                </div>
                
              </div>
            </div>
            <div className='trangle'></div>
          </Link>
        </div>

      </div>
    
      <button className="slider-button prev" onClick={prevSlide}>
        &#10094;
      </button>
      
      {images.map((image, index) => (
        image ? (
          <img 
            key={index}
            src={image} 
            alt={`Slide ${index + 1}`}
            className={`slider-image ${index === currentIndex ? 'active' : ''}`}
          />
        ) : (
          <div 
            key={index}
            className={`slider-placeholder ${index === currentIndex ? 'active' : ''}`}
          >
            
          </div>
        )
      ))}
      
      <img 
        src={`${process.env.PUBLIC_URL}/images/background_img.png`} 
        alt="Overlay"
        className="overlay-image"
      />

      <img 
        src={`${process.env.PUBLIC_URL}/images/inner-img.png`} 
        alt="Overlay2"
        className="overlay-image2"
      />
      
      <button className="slider-button next" onClick={nextSlide}>
        &#10095;
      </button>

      <div className="dots">
        {images.map((_, index) => (
          <span 
            key={index}
            className={`dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageSlider; 