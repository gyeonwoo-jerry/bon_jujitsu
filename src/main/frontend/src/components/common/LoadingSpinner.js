import React from 'react';

const LoadingSpinner = ({ message = "로딩 중..." }) => {
  return (
      <div className="post-list-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>{message}</p>
        </div>
      </div>
  );
};

export default LoadingSpinner;