import React, { createContext, useContext, useState } from 'react';

// LoadingContext 생성
const LoadingContext = createContext();

// LoadingProvider 컴포넌트
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);

  // 로딩 시작
  const startLoading = () => {
    setLoadingCount(prev => {
      const newCount = prev + 1;
      console.log('🟢 Start Loading - Count:', newCount); // 디버깅 로그
      if (newCount === 1) {
        setIsLoading(true);
        console.log('🟢 Loading Started'); // 디버깅 로그
      }
      return newCount;
    });
  };

  // 로딩 종료
  const stopLoading = () => {
    setLoadingCount(prev => {
      const newCount = Math.max(0, prev - 1);
      console.log('🔴 Stop Loading - Count:', newCount); // 디버깅 로그
      if (newCount === 0) {
        setIsLoading(false);
        console.log('🔴 Loading Stopped'); // 디버깅 로그
      }
      return newCount;
    });
  };

  return (
      <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
        {children}
      </LoadingContext.Provider>
  );
};

// useLoading 훅
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};