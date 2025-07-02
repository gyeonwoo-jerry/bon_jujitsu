import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import '../styles/comment.css';

const Comment = ({ postId, postType = 'board', adminOnly = false }) => {
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
        return decodedPayload.sub;
      } catch (error) {
        console.error('토큰 디코딩 실패:', error);
      }
    }

    return null;
  };

  // 관리자 권한 확인
  const isAdmin = () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      return userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
    } catch (error) {
      console.error('관리자 권한 확인 중 오류:', error);
      return false;
    }
  };

  // 댓글 작성 권한 확인
  const canWriteComment = () => {
    if (!isLoggedIn()) return false;

    // QnA는 adminOnly가 true이면 관리자만 댓글(답변) 작성 가능
    if (adminOnly) {
      return isAdmin();
    }

    // 일반 게시물은 로그인한 사용자 누구나
    return true;
  };

  // 댓글 타입 결정 (postType에 따라)
  const getCommentType = () => {
    switch (postType) {
      case 'notice':
        return 'NOTICE';
      case 'qna':
        return 'QNA';
      case 'board':
      default:
        return 'BOARD';
    }
  };

  // 댓글 목록 불러오기
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get('/comment', {
        params: {
          targetId: postId,
          commentType: getCommentType()
        }
      });

      if (response.data.success) {
        setComments(response.data.content || []);
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
    if (postId && postType) {
      fetchComments();
    }
  }, [postId, postType]);

  // 새 댓글 작성
  const handleSubmitComment = async (e) => {
    e.preventDefault();

    if (!canWriteComment()) {
      if (adminOnly) {
        alert('관리자만 답변을 작성할 수 있습니다.');
      } else {
        alert('로그인이 필요합니다.');
      }
      return;
    }

    if (!newComment.trim()) {
      alert(postType === 'qna' ? '답변 내용을 입력해주세요.' : '댓글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post('/comment', {
        content: newComment,
        commentType: getCommentType(),
        targetId: parseInt(postId),
        parentId: null
      });

      if (response.data.success) {
        setNewComment('');
        await fetchComments(); // 댓글 목록 새로고침
      } else {
        alert(response.data.message || '댓글 작성에 실패했습니다.');
      }
    } catch (err) {
      console.error('댓글 작성 실패:', err);
      if (err.response?.status === 401) {
        alert('로그인이 필요합니다.');
      } else if (err.response?.status === 403) {
        alert('댓글 작성 권한이 없습니다.');
      } else {
        alert(err.response?.data?.message || '댓글 작성에 실패했습니다.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // 대댓글 작성
  const handleSubmitReply = async (parentId) => {
    if (!canWriteComment()) {
      if (adminOnly) {
        alert('관리자만 답변을 작성할 수 있습니다.');
      } else {
        alert('로그인이 필요합니다.');
      }
      return;
    }

    if (!replyContent.trim()) {
      alert('답글 내용을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const response = await API.post('/comment', {
        content: replyContent,
        commentType: getCommentType(),
        targetId: parseInt(postId),
        parentId: parentId
      });

      if (response.data.success) {
        setReplyContent('');
        setReplyingTo(null);
        await fetchComments(); // 댓글 목록 새로고침
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

    // 사용자 ID가 없으면 권한 없음
    if (!currentUserId) {
      return false;
    }

    // 안전한 비교를 위해 문자열로 변환
    const currentUserIdStr = String(currentUserId);
    const commentUserIdStr = String(comment.userId);
    const isOwner = currentUserIdStr === commentUserIdStr;

    // QnA의 경우 관리자만 수정/삭제 가능
    if (postType === 'qna') {
      return userIsAdmin;
    }

    // 일반 게시물의 경우 작성자 또는 관리자
    return userIsAdmin || isOwner;
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
        <div key={comment.id} className={`comment-item depth-${depth} ${postType === 'qna' ? 'qna-comment' : ''}`}>
          <div className="comment-content">
            <div className="comment-header">
              <span className="comment-author">
                {comment.name}
                {postType === 'qna' && isAdmin() && (
                    <span className="admin-badge">관리자</span>
                )}
              </span>
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
                    placeholder={postType === 'qna' ? '답변을 수정해주세요...' : '댓글을 수정해주세요...'}
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
              {/* QnA에서는 대댓글 기능 제한 */}
              {canWriteComment() && postType !== 'qna' && depth < 2 && !isEditing && (
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
                        }}
                        className="btn-edit"
                    >
                      수정
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="btn-delete"
                    >
                      삭제
                    </button>
                  </>
              )}
            </div>
          </div>

          {/* 답글 작성 폼 - QnA에서는 비활성화 */}
          {isReplying && postType !== 'qna' && (
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

          {/* 대댓글 렌더링 - QnA에서는 제한 */}
          {postType !== 'qna' && comment.childComments && comment.childComments.length > 0 && (
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
    let typeLabel = '';
    switch (postType) {
      case 'notice':
        typeLabel = '공지사항';
        break;
      case 'qna':
        typeLabel = 'QnA';
        break;
      case 'board':
      default:
        typeLabel = '게시글';
        break;
    }

    const commentLabel = postType === 'qna' ? '답변' : '댓글';
    return `${typeLabel} ${commentLabel} ${comments.length}개`;
  };

  // 댓글 작성 폼 플레이스홀더
  const getCommentPlaceholder = () => {
    if (postType === 'qna') {
      return adminOnly ? '답변을 입력해주세요...' : '질문에 대한 답변을 입력해주세요...';
    }
    return '댓글을 입력해주세요...';
  };

  // 댓글 작성 버튼 텍스트
  const getSubmitButtonText = () => {
    if (postType === 'qna') {
      return submitting ? '답변 작성 중...' : '답변 작성';
    }
    return submitting ? '작성 중...' : '댓글 작성';
  };

  return (
      <div className={`comment-section ${postType === 'qna' ? 'qna-comment-section' : ''}`}>
        <h3 className="comment-title">
          {getCommentSectionTitle()}
        </h3>

        {/* 새 댓글 작성 폼 */}
        {canWriteComment() ? (
            <form onSubmit={handleSubmitComment} className="comment-form">
          <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={getCommentPlaceholder()}
              rows={4}
              disabled={submitting}
          />
              <div className="comment-form-actions">
                <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="btn-submit"
                >
                  {getSubmitButtonText()}
                </button>
              </div>
            </form>
        ) : (
            <div className="login-required">
              <p>
                {adminOnly
                    ? '관리자만 답변을 작성할 수 있습니다.'
                    : '댓글을 작성하려면 로그인이 필요합니다.'
                }
              </p>
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
                <p>{postType === 'qna' ? '답변을 불러오는 중...' : '댓글을 불러오는 중...'}</p>
              </div>
          ) : comments.length > 0 ? (
              comments.map(comment => renderComment(comment))
          ) : (
              <div className="no-comments">
                <p>
                  {postType === 'qna'
                      ? '아직 답변이 없습니다. 첫 번째 답변을 작성해보세요!'
                      : '아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!'
                  }
                </p>
              </div>
          )}
        </div>
      </div>
  );
};

export default Comment;