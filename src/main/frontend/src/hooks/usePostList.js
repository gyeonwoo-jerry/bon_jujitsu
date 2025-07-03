import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';

export const usePostList = (apiEndpoint, pageSize = 12) => {
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

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString()
      });

      if (searchQuery.trim()) {
        if (searchType === 'title') {
          params.append('title', searchQuery.trim());
        } else if (searchType === 'author') {
          params.append('name', searchQuery.trim());
        } else if (searchType === 'content') {
          params.append('content', searchQuery.trim());
        }
      }

      const requestUrl = `${apiEndpoint}?${params.toString()}`;
      const response = await API.get(requestUrl);

      if (response.data.success) {
        const data = response.data.content;
        let posts = [];
        let totalPages = 0;
        let totalElements = 0;

        if (data.list) {
          posts = data.list;
          totalPages = data.totalPage || 0;
          totalElements = data.list.length;
        }

        setPosts(posts);
        setTotalPages(totalPages);
        setTotalElements(totalElements);
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

  useEffect(() => {
    fetchPosts();
  }, [currentPage, apiEndpoint]);

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchPosts();
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