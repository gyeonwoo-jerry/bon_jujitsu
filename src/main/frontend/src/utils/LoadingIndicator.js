import React from 'react';
import { useLoading } from './LoadingContext';
import '../styles/LoadingIndicator.css';

const LoadingIndicator = () => {
  const { isLoading } = useLoading();

  return null;

  if (!isLoading) return null;

  return (
      <div className="loading-overlay">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p className="loading-text">처리 중...</p>
        </div>
      </div>
  );
};

export default LoadingIndicator;