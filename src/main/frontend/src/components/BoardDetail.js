import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';
import Comment from './Comment';
import '../styles/boardDetail.css';

const BoardDetail = () => {
  const { branchId, boardId } = useParams();
  const navigate = useNavigate();
  const loggedNav = loggedNavigate(navigate);
  const fetchedRef = useRef(false);

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [canEditState, setCanEditState] = useState(false);

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
    if (!board) return false;

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
      console.log('❌ 사용자 ID를 찾을 수 없음');
      return false;
    }

    console.log('=== 작성자 확인 ===');
    console.log('현재 사용자 ID:', userId, '(타입:', typeof userId, ')');
    console.log('게시글 작성자 ID:', board.authorId, '(타입:', typeof board.authorId, ')');

    // 안전한 비교를 위해 문자열로 변환하여 비교
    const isUserAuthor = String(userId) === String(board.authorId);
    console.log('작성자 여부:', isUserAuthor);

    return isUserAuthor;
  };

  // 관리자인지 확인하는 함수
  const isAdmin = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    console.log('=== 관리자 확인 ===');
    console.log('사용자 role:', userInfo.role);
    console.log('사용자 isAdmin:', userInfo.isAdmin);

    const adminStatus = userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
    console.log('관리자 여부:', adminStatus);

    return adminStatus;
  };

  // 수정/삭제 권한 확인 - React 상태로 관리
  useEffect(() => {
    const checkEditPermission = () => {
      if (!board) {
        setCanEditState(false);
        return;
      }

      const loggedIn = isLoggedIn();
      const userIsAuthor = isAuthor();
      const userIsAdmin = isAdmin();
      const permission = loggedIn && (userIsAuthor || userIsAdmin);

      console.log('=== 수정/삭제 권한 체크 ===');
      console.log('로그인 상태:', loggedIn);
      console.log('작성자 여부:', userIsAuthor);
      console.log('관리자 여부:', userIsAdmin);
      console.log('최종 권한:', permission);

      setCanEditState(permission);
    };

    // board 데이터가 로드된 후에 권한 체크
    if (board) {
      checkEditPermission();
    }
  }, [board]); // board가 변경될 때마다 실행

  // localStorage 변경 감지 (로그인/로그아웃 시)
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('localStorage 변경 감지됨 - 권한 재확인');
      if (board) {
        const loggedIn = isLoggedIn();
        const userIsAuthor = isAuthor();
        const userIsAdmin = isAdmin();
        const permission = loggedIn && (userIsAuthor || userIsAdmin);

        setCanEditState(permission);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [board]);

  useEffect(() => {
    // boardId가 바뀔 때마다 초기화
    fetchedRef.current = false;
    setCanEditState(false); // 권한 상태도 초기화

    // ID 유효성 검사
    if (!boardId || boardId === 'undefined' || isNaN(Number(boardId))) {
      setError('유효하지 않은 게시글 ID입니다.');
      setLoading(false);
      return;
    }

    if (!branchId || branchId === 'undefined' || isNaN(Number(branchId))) {
      setError('유효하지 않은 지부 ID입니다.');
      setLoading(false);
      return;
    }

    fetchBoardDetail();
  }, [branchId, boardId]);

  const fetchBoardDetail = async () => {
    // 중복 호출 방지
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      setError('');

      console.log('📡 API 요청:', `/board/${boardId}`);
      const response = await API.get(`/board/${boardId}`);

      if (response.data.success) {
        const boardData = response.data.content;
        console.log('📥 받은 board 데이터:', boardData);

        setBoard(boardData);

        // 페이지 제목 설정
        if (boardData.title) {
          document.title = `${boardData.title} - 게시글 상세`;
        }
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

  const handleEditBoard = () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!canEditState) {
      alert('수정 권한이 없습니다.');
      return;
    }

    loggedNav(`/board/edit/${boardId}`);
  };

  const handleDeleteBoard = async () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!canEditState) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        const response = await API.delete(`/board/${boardId}`);
        if (response.data.success) {
          alert('게시글이 삭제되었습니다.');
          // 삭제 완료 후 지부 상세 페이지로 이동
          loggedNav(`/branches/${branchId}`);
        } else {
          alert(response.data.message || '게시글 삭제에 실패했습니다.');
        }
      } catch (err) {
        console.error('삭제 에러:', err);
        if (err.response?.status === 403) {
          alert('삭제 권한이 없습니다.');
        } else {
          alert('게시글 삭제에 실패했습니다.');
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

  if (!board) {
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
                    onClick={handleEditBoard}
                    className="btn-edit"
                >
                  수정
                </button>
                <button
                    onClick={handleDeleteBoard}
                    className="btn-delete"
                >
                  삭제
                </button>
              </div>
          )}
        </div>

        <div className="board-detail-content">
          <div className="board-header">
            <h1 className="board-title">{board.title}</h1>
            <div className="board-meta">
              <div className="board-meta-left">
                <span className="author">작성자: {board.author}</span>
                <span className="region">지역: {board.region}</span>
              </div>
              <div className="board-meta-right">
                <span className="date">작성일: {formatDate(board.createdAt)}</span>
                <span className="views">조회수: {board.viewCount?.toLocaleString()}</span>
                <span className="comments">댓글: {board.commentCount}</span>
              </div>
            </div>
          </div>

          <div className="board-content">
            <div className="content-text">
              {board.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
              ))}
            </div>

            {board.images && board.images.length > 0 && (
                <div className="board-images">
                  <h4>첨부 이미지</h4>
                  <div className="image-grid">
                    {board.images.map((image, index) => (
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

          {board.modifiedAt && board.modifiedAt !== board.createdAt && (
              <div className="board-modified">
                <small>마지막 수정: {formatDate(board.modifiedAt)}</small>
              </div>
          )}
        </div>

        {/* 댓글 섹션 */}
        <Comment boardId={boardId} />

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

export default BoardDetail;