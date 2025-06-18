// src/components/ProtectedRoute.js
import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getWithExpiry } from '../utils/storage';

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = 로딩중

  useEffect(() => {
    const checkAuth = () => {
      const accessToken = getWithExpiry('accessToken');
      const refreshToken = getWithExpiry('refreshToken');

      if (accessToken || refreshToken) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // 로딩 중일 때 (빈 화면 또는 로딩 스피너)
  if (isAuthenticated === null) {
    return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          로딩중...
        </div>
    );
  }

  // 인증되지 않았을 때 홈으로 리다이렉트
  if (!isAuthenticated) {
    // 로그인 모달 표시를 위한 플래그 설정
    localStorage.setItem("showLoginModal", "true");
    alert('로그인이 필요한 페이지입니다.');
    return <Navigate to="/" replace />;
  }

  // 인증되었을 때만 자식 컴포넌트 렌더링
  return children;
};

export default ProtectedRoute;