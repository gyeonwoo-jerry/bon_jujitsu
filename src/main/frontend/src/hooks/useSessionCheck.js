// src/hooks/useSessionCheck.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWithExpiry } from '../utils/storage';

const useSessionCheck = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      const accessToken = getWithExpiry('accessToken');
      const refreshToken = getWithExpiry('refreshToken');

      // 토큰이 모두 없으면 세션 만료
      if (!accessToken && !refreshToken) {
        // 현재 페이지가 보호된 페이지인지 확인
        const protectedPaths = ['/mypage', '/admin']; // 보호된 경로들 추가
        const currentPath = window.location.pathname;

        if (protectedPaths.some(path => currentPath.includes(path))) {
          alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userInfo");
          localStorage.setItem("showLoginModal", "true");
          navigate('/', { replace: true });
        }
      }
    };

    // 페이지 로드 시 체크
    checkSession();

    // 5분마다 세션 체크
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // 윈도우 포커스 시 체크 (다른 탭에서 로그아웃했을 수 있음)
    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [navigate]);
};

export default useSessionCheck;