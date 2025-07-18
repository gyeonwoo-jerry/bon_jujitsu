import { useState, useEffect, useRef } from 'react';
import { POST_TYPE_CONFIGS } from '../configs/postTypeConfigs';
import API from '../utils/api';

// 전역 요청 캐시 (같은 요청이 동시에 여러 번 호출되는 것을 방지)
const requestCache = new Map();
const MAX_CACHE_SIZE = 50; // 최대 캐시 크기 제한

export const usePostData = (postType, postId) => {
  const [originalPost, setOriginalPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isMountedRef = useRef(true);
  const hasRequestedRef = useRef(false);

  const config = POST_TYPE_CONFIGS[postType];

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    return config?.apiEndpoint || '/board';
  };

  useEffect(() => {
    isMountedRef.current = true;

    const fetchPostData = async () => {
      // 필수 값 체크
      if (!postId || !postType || !config || hasRequestedRef.current) {
        if (isMountedRef.current && !config) {
          setLoading(false);
        }
        return;
      }

      // 캐시 크기 제한
      if (requestCache.size >= MAX_CACHE_SIZE) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }

      // 요청 키 생성
      const requestKey = `${postType}-${postId}`;

      // 이미 동일한 요청이 진행 중인지 확인
      if (requestCache.has(requestKey)) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`⏳ 동일한 요청이 진행 중입니다: ${requestKey}`);
        }

        try {
          // 기존 요청의 결과를 기다림
          const cachedResult = await requestCache.get(requestKey);

          if (isMountedRef.current) {
            setOriginalPost(cachedResult);
            setLoading(false);
          }
        } catch (error) {
          if (isMountedRef.current) {
            setError('게시글을 불러오는데 실패했습니다.');
            setLoading(false);
          }
        }
        return;
      }

      hasRequestedRef.current = true;

      try {
        if (isMountedRef.current) {
          setLoading(true);
          setError('');
        }

        const apiEndpoint = getApiEndpoint();

        // 개발 환경에서만 로그 출력
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 API 호출: ${apiEndpoint}/${postId}`);
        }

        // 요청 Promise를 캐시에 저장
        const requestPromise = API.get(`${apiEndpoint}/${postId}`)
        .then(response => {
          if (response.data.success) {
            const postData = response.data.content || response.data.data;
            if (process.env.NODE_ENV === 'development') {
              console.log(`✅ 데이터 로드 성공: ${postType}/${postId}`);
            }
            return postData;
          } else {
            throw new Error(response.data.message || '게시글을 불러올 수 없습니다.');
          }
        })
        .catch(error => {
          // 에러 발생 시 즉시 캐시에서 제거
          requestCache.delete(requestKey);
          throw error;
        })
        .finally(() => {
          // 요청 완료 후 캐시에서 제거 (5초 후)
          setTimeout(() => {
            requestCache.delete(requestKey);
          }, 5000);
        });

        requestCache.set(requestKey, requestPromise);

        const postData = await requestPromise;

        // 컴포넌트가 아직 마운트된 상태일 때만 상태 업데이트
        if (isMountedRef.current) {
          setOriginalPost(postData);
        }
      } catch (error) {
        console.error('게시글 데이터 로드 실패:', error);

        // 캐시에서 제거
        requestCache.delete(requestKey);

        if (isMountedRef.current) {
          if (error.response?.status === 404) {
            setError('존재하지 않는 게시글입니다.');
          } else if (error.response?.status === 403) {
            setError('게시글에 접근할 권한이 없습니다.');
          } else {
            setError('게시글을 불러오는데 실패했습니다.');
          }
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchPostData();

    // cleanup 함수
    return () => {
      isMountedRef.current = false;
    };
  }, [postId, postType]);

  // 파라미터 변경시 요청 플래그 초기화
  useEffect(() => {
    hasRequestedRef.current = false;
    setError('');
    setOriginalPost(null);
    setLoading(true);
  }, [postId, postType]);

  // 컴포넌트 언마운트 시 cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      hasRequestedRef.current = false;
    };
  }, []);

  return {
    originalPost,
    loading,
    error,
    post: originalPost
  };
};