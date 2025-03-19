import React, { useState, useEffect, useCallback } from 'react';
import '../styles/ImageSlider.css';

function ImageSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
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
    <div className="slider-container">
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