// Navigation 로깅 유틸리티
export const loggedNavigate = (navigate) => {
  return (path, options) => {
    // undefined가 포함된 경로 감지
    if (String(path).includes('undefined')) {
      console.error("🚨 UNDEFINED 경로 감지:", path);
      console.trace("호출 스택:");
      
      // undefined 경로 차단
      console.log("UNDEFINED 경로를 차단했습니다.");
      return;
    }
    
    return navigate(path, options);
  };
}; 