import axios from "axios";
import config from "./config";
import { setWithExpiry, getWithExpiry } from "./storage";

// axios 인스턴스 생성
const API = axios.create({
  baseURL: config.apiUrl + "/api", // 환경 변수에서 API URL 읽기
  withCredentials: true, // 쿠키 포함 (백엔드 설정 필요 시)
});

// 요청 인터셉터 설정
API.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 가져오기
    const token = getWithExpiry("accessToken");

    // 토큰이 있는 경우 Authorization 헤더에 추가
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    config.headers["Content-Type"] =
      config.headers["Content-Type"] || "application/json";

    console.log("Axios Request Headers:", config.headers); // 디버깅용 로그
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 설정
API.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        // 리프레시 토큰으로 새 토큰 요청
        const refreshToken = getWithExpiry("refreshToken");
        const response = await axios.post(
          `${config.apiUrl}/api/refresh-token`,
          { refreshToken }
        );
        const { token } = response.data;
        setWithExpiry("accessToken", token, 1000 * 60 * 60); // 새 토큰 저장
        originalRequest.headers["Authorization"] = `Bearer ${token}`; // 새 토큰으로 요청 헤더 업데이트
        return API(originalRequest); // 원래 요청 재시도
      } catch (refreshError) {
        // 리프레시 실패 시 로그인 페이지로 리다이렉트
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
