import React from 'react';

const PostCard = ({
  post,
  type = 'skill',
  onClick,
  showRegion = false,
  maxContentLength = 80
}) => {
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

  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  const getCardClassName = () => {
    switch (type) {
      case 'news': return "news-card";
      case 'sponsor': return "sponsor-card";
      case 'skill':
      default: return "skill-card";
    }
  };

  const getDefaultIcon = () => {
    switch (type) {
      case 'news': return '📰';
      case 'sponsor': return '🤝';
      case 'skill':
      default: return '🥋';
    }
  };

  return (
      <div className={getCardClassName()} onClick={onClick}>
        <div className="card-image">
          {post.images && post.images.length > 0 ? (
              <img
                  src={post.images[0].url}
                  alt={post.title}
                  onError={(e) => {
                    e.target.src = '/images/blank_img.png';
                  }}
              />
          ) : (
              <div className="no-image">
                <span>{getDefaultIcon()}</span>
              </div>
          )}
          {post.images && post.images.length > 1 && (
              <div className="image-count-badge">
                +{post.images.length - 1}
              </div>
          )}
        </div>

        <div className="card-content">
          <h3 className="card-title">{post.title}</h3>
          <p className="card-description">
            {truncateText(post.content, maxContentLength)}
          </p>

          <div className="card-meta">
            <div className="meta-left">
              <span className="author">👤 {post.author}</span>
              {showRegion && post.region && (
                  <span className="region">📍 {post.region}</span>
              )}
            </div>
            <div className="meta-right">
              <span className="date">📅 {formatDate(post.createdAt)}</span>
              <span className="views">👁 {post.viewCount?.toLocaleString()}</span>
            </div>
          </div>

          {post.modifiedAt && post.modifiedAt !== post.createdAt && (
              <div className="modified-info">
                <small>✏️ 수정: {formatDate(post.modifiedAt)}</small>
              </div>
          )}

          {type === 'sponsor' && post.url && (
              <div className="sponsor-info">
                <span className="website">🌐 웹사이트</span>
              </div>
          )}
        </div>

        <div className="card-overlay">
          <span className="view-detail">자세히 보기 →</span>
        </div>
      </div>
  );
};

export default PostCard;