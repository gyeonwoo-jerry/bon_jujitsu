import axios from "axios";
import config from "./config";
// axios 인스턴스 생성
const API = axios.create({
  baseURL: config.apiUrl + "/api", // 환경 변수에서 API URL 읽기
  withCredentials: true, // 쿠키 포함 (백엔드 설정 필요 시)
});

// 요청 인터셉터 설정
API.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 가져오기
    const token = localStorage.getItem("token");

    // 토큰이 있는 경우 Authorization 헤더에 추가
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default API;
