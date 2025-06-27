import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';
import Comment from './Comment';
import '../styles/boardDetail.css';

const PostDetail = () => {
  const params = useParams();
  const { branchId, boardId, noticeId } = params;
  const location = useLocation();
  const navigate = useNavigate();
  const loggedNav = loggedNavigate(navigate);
  const fetchedRef = useRef(false);

  const [post, setPost] = useState(null);
  const [postType, setPostType] = useState(null); // 'board' 또는 'notice'
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [canEditState, setCanEditState] = useState(false);

  // URL에서 게시물 타입과 ID 추출
  useEffect(() => {
    if (params.branchId && params.postType && params.postId) {
      // postType 유효성 검증
      if (params.postType === 'board' || params.postType === 'notice') {
        setPostType(params.postType);
        setPostId(params.postId);
      } else {
        setError("잘못된 게시글 타입입니다. board 또는 notice만 가능합니다.");
        setLoading(false);
        return;
      }
    } else if (boardId) {
      // 기존 params 방식 지원 (하위 호환성)
      setPostType('board');
      setPostId(boardId);
    } else if (noticeId) {
      setPostType('notice');
      setPostId(noticeId);
    } else {
      setError('잘못된 접근입니다. 올바른 게시물 페이지에서 접근해주세요.');
      setLoading(false);
      return;
    }

    // fetchedRef 초기화
    fetchedRef.current = false;
    setCanEditState(false);
  }, [params]);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  // JWT 토큰에서 사용자 ID 추출하는 함수
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.sub;
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
      return null;
    }
  };

  // 현재 사용자가 작성자인지 확인하는 함수
  const isAuthor = () => {
    if (!post) return false;

    // 1. localStorage의 userInfo에서 id 가져오기
    const userInfoString = localStorage.getItem('userInfo');
    let userId = null;

    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      userId = userInfo.id;
    }

    // 2. userInfo에 id가 없으면 토큰에서 추출
    if (!userId) {
      userId = getUserIdFromToken();
    }

    if (!userId) {
      return false;
    }

    // 안전한 비교를 위해 문자열로 변환하여 비교
    return String(userId) === String(post.authorId);
  };

  // 관리자인지 확인하는 함수
  const isAdmin = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
  };

  // 지부 Owner인지 확인하는 함수 (공지사항용)
  const isBranchOwner = () => {
    if (postType !== 'notice') return false; // 공지사항이 아니면 체크하지 않음

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 모든 지부에 수정/삭제 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (Owner 역할만)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      return userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        const isSameBranch = String(userBranchId) === String(currentBranchId);
        const isOwnerRole = role === "OWNER";

        return isSameBranch && isOwnerRole;
      });
    }

    return false;
  };

  // 수정/삭제 권한 확인 - React 상태로 관리
  useEffect(() => {
    const checkEditPermission = () => {
      if (!post || !postType) {
        setCanEditState(false);
        return;
      }

      const loggedIn = isLoggedIn();
      const userIsAuthor = isAuthor();
      const userIsAdmin = isAdmin();

      let permission = false;

      if (postType === 'board') {
        permission = loggedIn && (userIsAuthor || userIsAdmin);
      } else if (postType === 'notice') {
        const userIsBranchOwner = isBranchOwner();
        permission = loggedIn && (userIsAuthor || userIsAdmin || userIsBranchOwner);
      }

      setCanEditState(permission);
    };

    // 약간의 지연을 두고 실행 (데이터 로딩 완료 대기)
    const timer = setTimeout(checkEditPermission, 100);

    return () => clearTimeout(timer);
  }, [post, postType, branchId]);

  // localStorage 변경 감지 (로그인/로그아웃 시)
  useEffect(() => {
    const handleStorageChange = () => {
      if (post && postType && branchId) {
        const loggedIn = isLoggedIn();
        const userIsAuthor = isAuthor();
        const userIsAdmin = isAdmin();
        const userIsBranchOwner = isBranchOwner();

        let permission = false;
        if (postType === 'notice') {
          permission = loggedIn && (userIsAuthor || userIsAdmin || userIsBranchOwner);
        } else {
          permission = loggedIn && (userIsAuthor || userIsAdmin);
        }

        setCanEditState(permission);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [post, postType, branchId]);

  // 게시물 불러오기
  useEffect(() => {
    if (postType && postId && branchId) {
      // ID 유효성 검사
      if (!postId || postId === 'undefined' || isNaN(Number(postId))) {
        setError('유효하지 않은 게시글 ID입니다.');
        setLoading(false);
        return;
      }

      if (!branchId || branchId === 'undefined' || isNaN(Number(branchId))) {
        setError('유효하지 않은 지부 ID입니다.');
        setLoading(false);
        return;
      }

      fetchPostDetail();
    }
  }, [branchId, postType, postId]);

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    return postType === 'notice' ? '/notice' : '/board';
  };

  // 게시물 타입에 따른 제목
  const getPageTitle = (title) => {
    const typeLabel = postType === 'notice' ? '공지사항' : '게시글';
    return title ? `${title} - ${typeLabel} 상세` : `${typeLabel} 상세`;
  };

  const fetchPostDetail = async () => {
    // 중복 호출 방지
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      setError('');

      const apiEndpoint = getApiEndpoint();
      const response = await API.get(`${apiEndpoint}/${postId}`);

      if (response.data.success) {
        const postData = response.data.content;
        setPost(postData);

        // 페이지 제목 설정
        document.title = getPageTitle(postData.title);
      } else {
        setError(response.data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('API 에러:', err);
      if (err.response?.status === 404) {
        setError('존재하지 않는 게시글입니다.');
      } else if (err.response?.status === 403) {
        setError('게시글에 접근할 권한이 없습니다.');
      } else {
        setError('게시글을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    // 지부 상세 페이지로 이동
    loggedNav(`/branches/${branchId}`);
  };

  const handleEditPost = () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!canEditState) {
      alert('수정 권한이 없습니다.');
      return;
    }

    // App.js의 라우팅 구조에 맞게 수정 페이지로 이동
    loggedNav(`/branches/${branchId}/${postType}/${postId}/edit`);
  };

  const handleDeletePost = async () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!canEditState) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    const typeLabel = postType === 'notice' ? '공지사항' : '게시글';
    if (window.confirm(`정말로 이 ${typeLabel}을 삭제하시겠습니까?`)) {
      try {
        const apiEndpoint = getApiEndpoint();
        const response = await API.delete(`${apiEndpoint}/${postId}`);
        if (response.data.success) {
          alert(`${typeLabel}이 삭제되었습니다.`);
          // 삭제 완료 후 지부 상세 페이지로 이동
          loggedNav(`/branches/${branchId}`);
        } else {
          alert(response.data.message || `${typeLabel} 삭제에 실패했습니다.`);
        }
      } catch (err) {
        console.error('삭제 에러:', err);
        if (err.response?.status === 403) {
          alert('삭제 권한이 없습니다.');
        } else {
          alert(`${typeLabel} 삭제에 실패했습니다.`);
        }
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  if (loading) {
    return (
        <div className="board-detail-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>게시글을 불러오는 중...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="board-detail-container">
          <div className="error-message">
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
            <button onClick={handleBackToList} className="btn-secondary">
              목록으로 돌아가기
            </button>
          </div>
        </div>
    );
  }

  if (!post) {
    return (
        <div className="board-detail-container">
          <div className="error-message">
            <h3>게시글을 찾을 수 없습니다</h3>
            <button onClick={handleBackToList} className="btn-secondary">
              목록으로 돌아가기
            </button>
          </div>
        </div>
    );
  }

  const typeLabel = postType === 'notice' ? '공지사항' : '게시글';

  return (
      <div className="board-detail-container">
        <div className="board-detail-header">
          <button onClick={handleBackToList} className="btn-back">
            ← 목록으로
          </button>
          {/* 수정/삭제 버튼 - 권한이 있을 때만 표시 */}
          {canEditState && (
              <div className="board-actions">
                <button
                    onClick={handleEditPost}
                    className="btn-edit"
                >
                  수정
                </button>
                <button
                    onClick={handleDeletePost}
                    className="btn-delete"
                >
                  삭제
                </button>
              </div>
          )}
        </div>

        <div className="board-detail-content">
          <div className="board-header">
            <h1 className="board-title">{post.title}</h1>
            <div className="board-meta">
              <div className="board-meta-left">
                <span className="author">작성자: {post.author}</span>
                <span className="region">지역: {post.region}</span>
                <span className="post-type">{typeLabel}</span>
              </div>
              <div className="board-meta-right">
                <span className="date">작성일: {formatDate(post.createdAt)}</span>
                <span className="views">조회수: {post.viewCount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="board-content">
            <div className="content-text">
              {post.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
              ))}
            </div>

            {post.images && post.images.length > 0 && (
                <div className="board-images">
                  <h4>첨부 이미지</h4>
                  <div className="image-grid">
                    {post.images.map((image, index) => (
                        <div key={image.id || index} className="image-item">
                          <img
                              src={image.url}
                              alt={`첨부 이미지 ${index + 1}`}
                              onClick={() => openImageModal(image.url)}
                              className="board-image"
                          />
                        </div>
                    ))}
                  </div>
                </div>
            )}
          </div>

          {post.modifiedAt && post.modifiedAt !== post.createdAt && (
              <div className="board-modified">
                <small>마지막 수정: {formatDate(post.modifiedAt)}</small>
              </div>
          )}
        </div>

        {/* 댓글 섹션 */}
        <Comment boardId={postId} postType={postType} />

        {/* 이미지 모달 */}
        {selectedImage && (
            <div className="image-modal" onClick={closeImageModal}>
              <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                <img src={selectedImage} alt="확대된 이미지" />
                <button className="modal-close" onClick={closeImageModal}>
                  ×
                </button>
              </div>
            </div>
        )}
      </div>
  );
};

export default PostDetail;