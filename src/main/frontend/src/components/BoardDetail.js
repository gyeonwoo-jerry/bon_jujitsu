import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';
import '../styles/boardDetail.css';

const BoardDetail = ({ apiEndpoint = '/board', postId: propPostId, onPostLoad }) => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const loggedNav = loggedNavigate(navigate);
  const fetchedRef = useRef(false);
  const currentBoardIdRef = useRef(null); // 현재 로드된 boardId 추적

  const { branchId, boardId } = params;

  // 수동 파라미터 추출 (라우터 파라미터가 실패할 경우 백업)
  const [extractedBranchId, setExtractedBranchId] = useState(null);
  const [extractedBoardId, setExtractedBoardId] = useState(null);

  useEffect(() => {
    const path = location.pathname;

    // URL 패턴: /branches/{branchId}/board/{boardId}
    const matches = path.match(/\/branches\/(\d+)\/board\/(\d+)/);
    if (matches) {
      const [, extractedBranch, extractedBoard] = matches;
      setExtractedBranchId(extractedBranch);
      setExtractedBoardId(extractedBoard);
    }
  }, [location.pathname]);

  // 최종 사용할 ID들 (props 우선, 없으면 라우터 파라미터, 그것도 없으면 수동 추출 값 사용)
  const finalBranchId = branchId || extractedBranchId;
  const finalBoardId = propPostId || boardId || extractedBoardId;

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    // boardId가 바뀔 때만 초기화 (같은 boardId면 무시)
    if (currentBoardIdRef.current !== finalBoardId) {
      console.log('🔄 BoardId 변경됨:', currentBoardIdRef.current, '→', finalBoardId);
      fetchedRef.current = false;
      currentBoardIdRef.current = finalBoardId;
    } else {
      console.log('⏭️ 같은 BoardId - 건너뜀:', finalBoardId);
      return;
    }

    // boardId 유효성 검사
    if (!finalBoardId || finalBoardId === 'undefined' || isNaN(Number(finalBoardId))) {
      setError('유효하지 않은 게시글 ID입니다.');
      setLoading(false);
      return;
    }

    // branchId 유효성 검사
    if (!finalBranchId || finalBranchId === 'undefined' || isNaN(Number(finalBranchId))) {
      setError('유효하지 않은 지부 ID입니다.');
      setLoading(false);
      return;
    }

    fetchBoardDetail();
  }, [finalBranchId, finalBoardId]);

  const fetchBoardDetail = async () => {
    // 디버깅 로그
    console.log('🔍 fetchBoardDetail 호출됨');
    console.log('fetchedRef.current:', fetchedRef.current);
    console.log('finalBoardId:', finalBoardId);
    console.log('apiEndpoint:', apiEndpoint);

    // 중복 호출 방지
    if (fetchedRef.current) {
      console.log('❌ 이미 호출됨 - 중단');
      return;
    }
    fetchedRef.current = true;
    console.log('✅ 첫 호출 - 진행');

    try {
      setLoading(true);
      setError('');

      // boardId 재검증
      if (!finalBoardId || finalBoardId === 'undefined' || isNaN(Number(finalBoardId))) {
        throw new Error('Invalid board ID');
      }

      console.log('📡 API 요청 시작:', `${apiEndpoint}/${finalBoardId}`);
      const response = await API.get(`${apiEndpoint}/${finalBoardId}`);

      console.log('📡 API 응답 받음:', response.status);

      if (response.data.success) {
        console.log('✅ 게시글 데이터 설정');
        setBoard(response.data.content);

        // 게시글 로드 완료 시 상위 컴포넌트에 제목 전달
        if (onPostLoad && response.data.content.title) {
          onPostLoad(response.data.content.title);
        }
      } else {
        console.log('❌ API 응답 실패:', response.data);
        setError(response.data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.log('💥 API 에러:', err);
      if (err.response?.status === 404) {
        setError('존재하지 않는 게시글입니다.');
      } else if (err.response?.status === 403) {
        setError('게시글에 접근할 권한이 없습니다.');
      } else if (err.message === 'Invalid board ID') {
        setError('유효하지 않은 게시글 ID입니다.');
      } else {
        setError('게시글을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    loggedNav(`/branches/${finalBranchId}/board`);
  };

  const handleEditBoard = () => {
    loggedNav(`/branches/${finalBranchId}/board/edit/${finalBoardId}`);
  };

  const handleDeleteBoard = async () => {
    if (window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
      try {
        const response = await API.delete(`${apiEndpoint}/${finalBoardId}`);
        if (response.data.success) {
          alert('게시글이 삭제되었습니다.');
          loggedNav(`/branches/${finalBranchId}/board`);
        } else {
          alert(response.data.message || '게시글 삭제에 실패했습니다.');
        }
      } catch (err) {
        alert('게시글 삭제에 실패했습니다.');
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

  // 현재 사용자가 작성자인지 확인하는 함수
  const isAuthor = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.id === board?.authorId;
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
          {isAuthor() && (
              <div className="board-actions">
                <button onClick={handleEditBoard} className="btn-edit">
                  수정
                </button>
                <button onClick={handleDeleteBoard} className="btn-delete">
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