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
    if (postType === 'faq') {
      // FAQ는 관리자만 작성하므로 간소화
      return post.authorName || post.author || '관리자';
    }
    return post.author;
  };

  return (
      <div className="board-header">
        <h1 className="board-title">{post.title}</h1>
        <div className="board-meta">
          <div className="board-meta-row">
            <div className="board-meta-left">
              <div className="author">
                <span>👤</span>
                <span>{getAuthorName()}</span>
              </div>
              {post.region && (
                  <div className="region">
                    <span>📍</span>
                    <span>{post.region}</span>
                  </div>
              )}
              <div className="date">
                <span>📅</span>
                <span>{formatDate(post.createdAt)}</span>
              </div>

              {/* ✅ 스킬 정보 섹션 추가 */}
              {postType === 'skill' && (
                  <div className="skill-info-section">
                    <div className="skill-details">
                      {post.position && (
                          <div className="skill-detail-item">
                            <span>📍</span>
                            <span>포지션: {post.position}</span>
                          </div>
                      )}
                      {post.skillType && (
                          <div className="skill-detail-item">
                            <span>🥋</span>
                            <span>기술: {post.skillType}</span>
                          </div>
                      )}
                    </div>
                  </div>
              )}
            </div>
            <div className="board-meta-right">
              {config.showViewCount && (
                  <div className="views">
                    <span>👁️</span>
                    <span>{post.viewCount?.toLocaleString()}</span>
                  </div>
              )}
            </div>
          </div>

          {post.modifiedAt && post.modifiedAt !== post.createdAt && (
              <div className="board-modified-info">
                마지막 수정: {formatDate(post.modifiedAt)}
              </div>
          )}
        </div>
      </div>
  );
};

export default PostDetailMeta;