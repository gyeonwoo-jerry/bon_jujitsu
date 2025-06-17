import axios from "axios";
import config from "./config";
import { setWithExpiry, getWithExpiry } from "./storage";

// axios 인스턴스 생성
const API = axios.create({
  baseURL: config.apiUrl + "/api", // 환경 변수에서 API URL 읽기
  withCredentials: true, // 쿠키 포함 (백엔드 설정 필요 시)
});

// 토큰 갱신 중복 방지를 위한 변수
let isRefreshing = false;
let failedQueue = [];

// 대기 중인 요청들을 처리하는 함수
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

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

      // undefined가 포함된 URL 요청 감지
      if (config.url?.includes('undefined')) {
        console.error("🚨 요청에서 UNDEFINED URL 감지:", config.url);
        console.trace("요청 호출 스택:");
      }

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
      console.log("=== API 오류 인터셉터 ===");
      console.log("요청 URL:", error.config?.url);
      console.log("오류 상태:", error.response?.status);
      console.log("오류 메시지:", error.message);

      // undefined가 포함된 URL 요청 감지
      if (error.config?.url?.includes('undefined')) {
        console.error("🚨 UNDEFINED URL 감지:", error.config.url);
        console.trace("호출 스택:");
      }

      const originalRequest = error.config;

      // 401 오류이고 토큰 갱신 요청이 아닌 경우 토큰 갱신 시도
      if (
          error.response &&
          error.response.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url.includes('/users/refresh') // 토큰 갱신 요청이 아닌 경우만
      ) {
        originalRequest._retry = true;

        // 이미 갱신 중이면 대기열에 추가
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return API(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        isRefreshing = true;

        try {
          // 리프레시 토큰으로 새 토큰 요청
          const refreshToken = getWithExpiry("refreshToken");

          if (!refreshToken) {
            throw new Error("리프레시 토큰이 없습니다.");
          }

          // 올바른 URL로 토큰 갱신 요청
          const response = await axios.post(
              `${config.apiUrl}/api/users/refresh`, // URL 수정!
              { refreshToken: refreshToken } // 요청 형식 수정!
          );

          if (response.data.success) {
            const newAccessToken = response.data.content.accessToken; // 응답 구조에 맞게 수정

            setWithExpiry("accessToken", newAccessToken, 1000 * 60 * 60); // 새 토큰 저장

            // 대기 중인 요청들에 새 토큰 적용
            processQueue(null, newAccessToken);

            // 원래 요청에 새 토큰 적용 후 재시도
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return API(originalRequest);
          } else {
            throw new Error("토큰 갱신 실패");
          }
        } catch (refreshError) {
          console.error("토큰 갱신 실패:", refreshError);

          processQueue(refreshError, null);

          // 리프레시 실패 시 로그인 페이지로 리다이렉트
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userInfo");

          alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/login";

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }
      return Promise.reject(error);
    }
);

export default API;