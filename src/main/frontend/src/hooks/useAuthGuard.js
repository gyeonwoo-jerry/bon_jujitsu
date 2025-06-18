// src/hooks/useAuthGuard.js (새로운 훅 생성)
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getWithExpiry } from '../utils/storage';

const useAuthGuard = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const protectedPaths = ['/mypage', '/admin'];
    const isProtectedPath = protectedPaths.some(path =>
        location.pathname.startsWith(path)
    );

    if (isProtectedPath) {
      const accessToken = getWithExpiry('accessToken');
      const refreshToken = getWithExpiry('refreshToken');

      if (!accessToken && !refreshToken) {
        alert('로그인이 필요한 페이지입니다.');
        localStorage.setItem("showLoginModal", "true");
        navigate('/', { replace: true });
      }
    }
  }, [location.pathname, navigate]);
};

export default useAuthGuard;