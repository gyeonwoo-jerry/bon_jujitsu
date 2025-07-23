import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';

export const usePostList = (apiEndpoint, pageSize = 12, filters = {}) => {
  const navigate = useNavigate();
  const safeNavigate = loggedNavigate(navigate);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('title');

  const fetchPosts = async (page = currentPage) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        size: pageSize.toString()
      });

      // 검색 파라미터 추가
      if (searchQuery.trim()) {
        if (searchType === 'title') {
          params.append('title', searchQuery.trim());
        } else if (searchType === 'author') {
          params.append('name', searchQuery.trim());
        } else if (searchType === 'content') {
          params.append('content', searchQuery.trim());
        }
      }

      // 스킬 전용 필터 파라미터 추가
      if (filters.position) {
        params.append('position', filters.position);
      }
      if (filters.skillType) {
        params.append('skillType', filters.skillType);
      }

      const requestUrl = `${apiEndpoint}?${params.toString()}`;
      console.log('API 요청 URL:', requestUrl);

      const response = await API.get(requestUrl);
      console.log('API 응답:', response.data);

      if (response.data.success) {
        const data = response.data.content || response.data.data;
        let posts = [];
        let totalPages = 0;
        let totalElements = 0;

        // 기존 API 응답 구조 (스킬 포함)
        if (data.list) {
          posts = data.list;
          totalPages = data.totalPage || 0;
          totalElements = data.list.length;
          console.log('파싱된 posts:', posts);
          console.log('totalPages:', totalPages);
        }
        // 다른 구조 대응
        else if (Array.isArray(data)) {
          posts = data;
          totalPages = Math.ceil(data.length / pageSize);
          totalElements = data.length;
        }

        setPosts(posts);
        setTotalPages(totalPages);
        setTotalElements(totalElements);
        setCurrentPage(page);
      } else {
        setError(response.data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('PostList 불러오기 오류:', err);
      setError('게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 초기 로딩 및 필터 변경 시 재로딩
  useEffect(() => {
    fetchPosts(1);
    setCurrentPage(1);
  }, [apiEndpoint, filters.position, filters.skillType]);

  // 페이지 변경 시 로딩
  useEffect(() => {
    if (currentPage > 1) {
      fetchPosts(currentPage);
    }
  }, [currentPage]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts(1);
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchPosts(1);
  };

  return {
    posts,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    searchQuery,
    searchType,
    setSearchQuery,
    setSearchType,
    handleSearch,
    handlePageChange,
    clearSearch,
    fetchPosts,
    navigate: safeNavigate
  };
};