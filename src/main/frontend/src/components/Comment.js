import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import '../styles/comment.css';

const Comment = ({ boardId, postType = 'board' }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  // 현재 사용자 ID 가져오기
  const getCurrentUserId = () => {
    // 1. userInfo에서 id 확인
    const userInfoString = localStorage.getItem('userInfo');
    if (userInfoString) {
      try {
        const userInfo = JSON.parse(userInfoString);
        if (userInfo.id) {
          console.log('userInfo에서 사용자 ID 발견:', userInfo.id, '(타입:', typeof userInfo.id, ')');
          return userInfo.id;
        }
      } catch (error) {
        console.error('userInfo 파싱 실패:', error);
      }
    }

    // 2. 토큰에서 추출
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (token) {
      try {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        console.log('토큰에서 사용자 ID 발견:', decodedPayload.sub, '(타입:', typeof decodedPayload.sub, ')');
        return decodedPayload.sub;
      } catch (error) {
        console.error('토큰 디코딩 실패:', error);
      }
    }

    console.log('사용자 ID를 찾을 수 없음');
    return null;
  };

  // 관리자 권한 확인
  const isAdmin = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      console.log('관리자 권한 확인 - userInfo:', userInfo);
      console.log('role:', userInfo.role);
      console.log('isAdmin:', userInfo.isAdmin);

      const adminStatus = userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
      console.log('관리자 여부:', adminStatus);

      return adminStatus;
    } catch (error) {
      console.error('관리자 권한 확인 중 오류:', error);
      return false;
    }
  };

  // 댓글 타입 결정 (postType에 따라)
  const getCommentType = () => {
    return postType === 'notice' ? 'NOTICE' : 'BOARD';
  };

  // 댓글 목록 불러오기
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('=== 댓글 불러오기 ===');
      console.log('boardId:', boardId);
      console.log('postType:', postType);
      console.log('commentType:', getCommentType());

      const response = await API.get('/comment', {
        params: {
          targetId: boardId,
          commentType: getCommentType() // BOARD 또는 NOTICE
        }
      });

      if (response.data.success) {
        setComments(response.data.content || []);
        console.log('댓글 불러오기 성공:', response.data.content?.length || 0, '개');
      } else {
        setError('댓글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('댓글 불러오기 실패:', err);
      setError('댓글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 댓글 불러오기
  useEffect(() => {
    if (boardId && postType) {
      fetchComments();
    }
  }, [boardId, postType]); // postType도 의존성에 추가

  // 새 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!newComment.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      console.log('=== 댓글 작성 ===');
      console.log('boardId:', boardId);
      console.log('postType:', postType);
      console.log('commentType:', getCommentType());

      const response = await API.post('/comment', {
        content: newComment,
        commentType: getCommentType(), // BOARD 또는 NOTICE
        targetId: parseInt(boardId),
        parentId: null
      });

      if (response.data.success) {
        setNewComment('');
        await fetchComments(); // 댓글 목록 새로고침
        console.log('댓글 작성 성공');
      } else {
        alert(response.data.message || '댓글 작성에 실패했습니다.');
      }
    } catch (err) {
      console.error('댓글 작성 실패:', err);
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
      } else {
        alert(err.response?.data?.message || '댓글 작성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 대댓글 작성
  const handleSubmitReply = async (parentId) => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!replyContent.trim()) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      console.log('=== 대댓글 작성 ===');
      console.log('parentId:', parentId);
      console.log('commentType:', getCommentType());

      const response = await API.post('/comment', {
        content: replyContent,
        commentType: getCommentType(), // BOARD 또는 NOTICE
        targetId: parseInt(boardId),
        parentId: parentId
      });

      if (response.data.success) {
        setReplyContent('');
        setReplyingTo(null);
        await fetchComments(); // 댓글 목록 새로고침
        console.log('대댓글 작성 성공');
      } else {
        alert(response.data.message || '답글 작성에 실패했습니다.');
      }
    } catch (err) {
      console.error('답글 작성 실패:', err);
      alert(err.response?.data?.message || '답글 작성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId) => {
    if (!editContent.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.patch(`/comment/${commentId}`, {
        content: editContent
      });

      if (response.data.success) {
        setEditingComment(null);
        setEditContent('');
        await fetchComments(); // 댓글 목록 새로고침
      } else {
        alert(response.data.message || '댓글 수정에 실패했습니다.');
      }
    } catch (err) {
      console.error('댓글 수정 실패:', err);
      alert(err.response?.data?.message || '댓글 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await API.delete(`/comment/${commentId}`);

      if (response.data.success) {
        await fetchComments(); // 댓글 목록 새로고침
      } else {
        alert(response.data.message || '댓글 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
      alert(err.response?.data?.message || '댓글 삭제에 실패했습니다.');
    }
  };

  // 수정/삭제 권한 확인
  const canModifyComment = (comment) => {
    const currentUserId = getCurrentUserId();
    const userIsAdmin = isAdmin();

    console.log('=== 댓글 수정 권한 확인 ===');
    console.log('댓글 전체 객체:', comment);
    console.log('현재 사용자 ID:', currentUserId, '(타입:', typeof currentUserId, ')');
    console.log('댓글 작성자 ID:', comment.userId, '(타입:', typeof comment.userId, ')');
    console.log('관리자 여부:', userIsAdmin);

    // 사용자 ID가 없으면 권한 없음
    if (!currentUserId) {
      console.log('사용자 ID가 없어서 권한 없음');
      return false;
    }

    // 안전한 비교를 위해 문자열로 변환
    const currentUserIdStr = String(currentUserId);
    const commentUserIdStr = String(comment.userId);
    const isOwner = currentUserIdStr === commentUserIdStr;
    const hasPermission = userIsAdmin || isOwner;

    console.log('현재 사용자 ID (문자열):', currentUserIdStr);
    console.log('댓글 작성자 ID (문자열):', commentUserIdStr);
    console.log('작성자 여부:', isOwner);
    console.log('최종 권한:', hasPermission);
    console.log('========================');

    return hasPermission;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffHours < 24) {
      return `${diffHours}시간 전`;
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR');
    }
  };

  // 댓글 렌더링 (재귀적으로 대댓글 포함)
  const renderComment = (comment, depth = 0) => {
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;

    return (
        <div key={comment.id} className={`comment-item depth-${depth}`}>
          <div className="comment-content">
            <div className="comment-header">
              <span className="comment-author">{comment.name}</span>
              <span className="comment-date">{formatDate(comment.createdAt)}</span>
              {comment.modifiedAt && comment.modifiedAt !== comment.createdAt && (
                  <span className="comment-modified">(수정됨)</span>
              )}
            </div>

            <div className="comment-body">
              {isEditing ? (
                  <div className="comment-edit-form">
                <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    placeholder="댓글을 수정해주세요..."
                    rows={3}
                    disabled={submitting}
                />
                    <div className="comment-edit-actions">
                      <button
                          type="button"
                          onClick={() => handleEditComment(comment.id)}
                          disabled={submitting}
                          className="btn-save"
                      >
                        {submitting ? '저장 중...' : '저장'}
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                            setEditingComment(null);
                            setEditContent('');
                          }}
                          disabled={submitting}
                          className="btn-cancel"
                      >
                        취소
                      </button>
                    </div>
                  </div>
              ) : (
                  <p className="comment-text">{comment.content}</p>
              )}
            </div>

            <div className="comment-actions">
              {isLoggedIn() && depth < 2 && !isEditing && (
                  <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(isReplying ? null : comment.id);
                        setReplyContent('');
                      }}
                      className="btn-reply"
                  >
                    {isReplying ? '취소' : '답글'}
                  </button>
              )}

              {canModifyComment(comment) && !isEditing && (
                  <>
                    <button
                        type="button"
                        onClick={() => {
                          setEditingComment(comment.id);
                          setEditContent(comment.content);
                          console.log('수정 모드 진입 - 댓글 ID:', comment.id);
                        }}
                        className="btn-edit"
                    >
                      수정
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                          console.log('삭제 시도 - 댓글 ID:', comment.id);
                          handleDeleteComment(comment.id);
                        }}
                        className="btn-delete"
                    >
                      삭제
                    </button>
                  </>
              )}

              {/* 디버깅용 임시 정보 표시 */}
              <span style={{ fontSize: '10px', color: '#999', marginLeft: '10px' }}>
                [권한: {canModifyComment(comment) ? 'O' : 'X'}] [타입: {getCommentType()}]
              </span>
            </div>
          </div>

          {/* 답글 작성 폼 */}
          {isReplying && (
              <div className="reply-form">
            <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="답글을 입력해주세요..."
                rows={3}
                disabled={submitting}
            />
                <div className="reply-actions">
                  <button
                      type="button"
                      onClick={() => handleSubmitReply(comment.id)}
                      disabled={submitting || !replyContent.trim()}
                      className="btn-submit"
                  >
                    {submitting ? '작성 중...' : '답글 작성'}
                  </button>
                  <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent('');
                      }}
                      disabled={submitting}
                      className="btn-cancel"
                  >
                    취소
                  </button>
                </div>
              </div>
          )}

          {/* 대댓글 렌더링 */}
          {comment.childComments && comment.childComments.length > 0 && (
              <div className="child-comments">
                {comment.childComments.map(childComment =>
                    renderComment(childComment, depth + 1)
                )}
              </div>
          )}
        </div>
    );
  };

  // 댓글 섹션 제목 결정
  const getCommentSectionTitle = () => {
    const typeLabel = postType === 'notice' ? '공지사항' : '게시글';
    return `${typeLabel} 댓글 ${comments.length}개`;
  };

  return (
      <div className="comment-section">
        <h3 className="comment-title">
          {getCommentSectionTitle()}
        </h3>

        {/* 새 댓글 작성 폼 */}
        {isLoggedIn() ? (
            <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="댓글을 입력해주세요..."
              rows={4}
              disabled={submitting}
          />
              <div className="comment-form-actions">
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="btn-submit"
                >
                  {submitting ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </form>
        ) : (
            <div className="login-required">
              <p>댓글을 작성하려면 로그인이 필요합니다.</p>
            </div>
        )}

        {/* 에러 메시지 */}
        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        {/* 댓글 목록 */}
        <div className="comment-list">
          {loading ? (
              <div className="loading-spinner">
                <p>댓글을 불러오는 중...</p>
              </div>
          ) : comments.length > 0 ? (
              comments.map(comment => renderComment(comment))
          ) : (
              <div className="no-comments">
                <p>아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!</p>
              </div>
          )}
        </div>
      </div>
  );
};

export default Comment;