// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { getWithExpiry } from '../utils/storage';

const ProtectedRoute = ({ children }) => {
  const accessToken = getWithExpiry('accessToken');
  const refreshToken = getWithExpiry('refreshToken');

  // 토큰이 없으면 홈으로 리다이렉트
  if (!accessToken && !refreshToken) {
    alert('로그인이 필요한 페이지입니다.');
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;