import React from 'react';

const PostDetailMeta = ({ post, postType, config }) => {
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

  const getAuthorName = () => {
    if (postType === 'qna') {
      return post.authorName || post.guestName || post.author || '익명';
    }
    return post.author;
  };

  return (
      <div className="board-header">
        <h1 className="board-title">{post.title}</h1>
        <div className="board-meta">
          <div className="board-meta-left">
          <span className="author">
            작성자: {getAuthorName()}
            {postType === 'qna' && post.guestName && (
                <span className="guest-badge">비회원</span>
            )}
          </span>
            {post.region && <span className="region">지역: {post.region}</span>}
            <span className="post-type">{config.title}</span>
          </div>
          <div className="board-meta-right">
            <span className="date">작성일: {formatDate(post.createdAt)}</span>
            {config.showViewCount && (
                <span className="views">조회수: {post.viewCount?.toLocaleString()}</span>
            )}
          </div>
        </div>

        {post.modifiedAt && post.modifiedAt !== post.createdAt && (
            <div className="board-modified">
              <small>마지막 수정: {formatDate(post.modifiedAt)}</small>
            </div>
        )}
      </div>
  );
};

export default PostDetailMeta;