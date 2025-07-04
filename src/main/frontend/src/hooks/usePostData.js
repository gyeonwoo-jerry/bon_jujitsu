import { useState, useEffect, useRef } from 'react';
import { POST_TYPE_CONFIGS } from '../configs/postTypeConfigs';
import API from '../utils/api';

export const usePostData = (postType, postId) => {
  const [originalPost, setOriginalPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  const config = POST_TYPE_CONFIGS[postType];

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    return config?.apiEndpoint || '/board';
  };

  useEffect(() => {
    const fetchPostData = async () => {
      // 중복 호출 방지 및 필수 값 체크
      if (fetchedRef.current || !postId || !postType || !config) {
        if (!config) setLoading(false);
        return;
      }

      fetchedRef.current = true;

      try {
        setLoading(true);
        setError('');

        const apiEndpoint = getApiEndpoint();
        const response = await API.get(`${apiEndpoint}/${postId}`);

        if (response.data.success) {
          setOriginalPost(response.data.content);
        } else {
          throw new Error(response.data.message || '게시글을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('게시글 데이터 로드 실패:', error);

        if (error.response?.status === 404) {
          setError('존재하지 않는 게시글입니다.');
        } else if (error.response?.status === 403) {
          setError('게시글에 접근할 권한이 없습니다.');
        } else {
          setError('게시글을 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPostData();
  }, [postId, postType, config]);

  // 파라미터 변경시 fetchedRef 초기화
  useEffect(() => {
    fetchedRef.current = false;
    setError('');
  }, [postType, postId]);

  return {
    originalPost,
    loading,
    error,
    // PostDetail에서는 post로 사용하고 싶을 수 있으므로 별칭 제공
    post: originalPost
  };
};