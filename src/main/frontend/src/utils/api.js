import axios from "axios";
import config from "./config";
import { setWithExpiry, getWithExpiry } from "./storage";

// axios 인스턴스 생성
const API = axios.create({
  baseURL: config.apiUrl + "/api",
  withCredentials: true,
});

// 토큰 갱신 중복 방지를 위한 변수
let isRefreshing = false;
let failedQueue = [];

// 로딩 상태 관리를 위한 변수들
let loadingManager = null;

// 로딩 매니저 설정 함수
export const setLoadingManager = (manager) => {
  loadingManager = manager;
};

// 로딩 제외할 URL 패턴들
const EXCLUDE_LOADING_PATTERNS = [
  '/users/refresh',
];

// URL이 로딩 제외 대상인지 확인
const shouldExcludeLoading = (url) => {
  return EXCLUDE_LOADING_PATTERNS.some(pattern => url?.includes(pattern));
};

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
      // 로딩 시작 (제외 대상이 아닌 경우만)
      if (!shouldExcludeLoading(config.url) && loadingManager) {
        loadingManager.startLoading();
      }

      // localStorage에서 토큰 가져오기
      const token = getWithExpiry("accessToken");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }

      config.headers["Content-Type"] = config.headers["Content-Type"] || "application/json";

      // undefined가 포함된 URL 요청 감지
      if (config.url?.includes('undefined')) {
        console.error("🚨 요청에서 UNDEFINED URL 감지:", config.url);
        console.trace("요청 호출 스택:");
      }

      return config;
    },
    (error) => {
      if (loadingManager) {
        loadingManager.stopLoading();
      }
      return Promise.reject(error);
    }
);

// 응답 인터셉터 설정
API.interceptors.response.use(
    (response) => {
      // 성공 응답 시 로딩 종료
      if (!shouldExcludeLoading(response.config.url) && loadingManager) {
        loadingManager.stopLoading();
      }

      return response;
    },
    async (error) => {
      console.log("=== API 오류 인터셉터 ===");
      console.log("요청 URL:", error.config?.url);
      console.log("오류 상태:", error.response?.status);

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
          !originalRequest.url.includes('/users/refresh')
      ) {
        originalRequest._retry = true;

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
          const refreshToken = getWithExpiry("refreshToken");
          if (!refreshToken) {
            throw new Error("리프레시 토큰이 없습니다.");
          }

          const response = await axios.post(
              `${config.apiUrl}/api/users/refresh`,
              { refreshToken: refreshToken }
          );

          if (response.data.success) {
            const newAccessToken = response.data.content.accessToken;
            setWithExpiry("accessToken", newAccessToken, 1000 * 60 * 60);
            processQueue(null, newAccessToken);
            originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
            return API(originalRequest);
          } else {
            throw new Error("토큰 갱신 실패");
          }
        } catch (refreshError) {
          console.error("토큰 갱신 실패:", refreshError);
          processQueue(refreshError, null);

          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("userInfo");
          localStorage.setItem("showLoginModal", "true");

          alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
          window.location.href = "/";

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // 오류 응답 시에도 로딩 종료
      if (!shouldExcludeLoading(originalRequest?.url) && loadingManager) {
        loadingManager.stopLoading();
      }

      return Promise.reject(error);
    }
);

export default API;