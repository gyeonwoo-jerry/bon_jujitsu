// Navigation 로깅 유틸리티
export const loggedNavigate = (navigate) => {
  return (path, options) => {
    if (String(path).includes('undefined')) {
      console.warn("🚨 UNDEFINED 경로 감지:", path);
      console.trace("호출 스택:");
      // return 하지 않고 로그만 찍음
    }
    return navigate(path, options);
  };
};