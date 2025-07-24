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
    // HTML 태그 제거
    const plainText = text.replace(/<[^>]*>/g, '');
    return plainText.length > maxLength ? plainText.substring(0, maxLength) + '...' : plainText;
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

  // API 응답에 맞게 이미지 데이터 처리
  const getImages = () => {
    // media 배열에서 IMAGE 타입만 필터링
    if (post.media && Array.isArray(post.media) && post.media.length > 0) {
      return post.media.filter(item => item.mediaType === 'IMAGE');
    }

    // 기존 images 배열 지원 (하위 호환성)
    if (post.images && Array.isArray(post.images)) {
      return post.images;
    }

    return [];
  };

  const images = getImages();
  const hasImages = images.length > 0;

  // 이미지 URL 생성 (PostDetail과 동일한 방식)
  const getImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
      return "/images/blank_img.png";
    }

    // 이미 완전한 URL이거나 /로 시작하는 경우 그대로 사용
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }

    // 상대경로인 경우 /를 앞에 추가
    return `/${url}`;
  };

  return (
      <div className={getCardClassName()} onClick={onClick}>
        <div className="card-image">
          {hasImages ? (
              <>
                <img
                    src={getImageUrl(images[0].url)}
                    alt={post.title}
                    onError={(e) => {
                      console.error('이미지 로드 실패:', e.target.src);
                      e.target.src = '/images/blank_img.png';
                    }}
                    onLoad={() => {
                      console.log('이미지 로드 성공:', getImageUrl(images[0].url));
                    }}
                />
                {images.length > 1 && (
                    <div className="image-count-badge">
                      +{images.length - 1}
                    </div>
                )}
              </>
          ) : (
              <div className="no-image">
                <span>{getDefaultIcon()}</span>
              </div>
          )}
        </div>

        <div className="card-content">
          <h3 className="card-title">{post.title}</h3>

          {/* 스킬 정보 추가 */}
          {type === 'skill' && (
              <div className="skill-info">
                {post.position && (
                    <span className="skill-badge position">
        📍 {post.position}
      </span>
                )}
                {post.skillType && (
                    <span className="skill-badge skill-type">
        🥋 {post.skillType}
      </span>
                )}
              </div>
          )}

          <div className="card-description">
            {truncateText(post.content, maxContentLength)}
          </div>

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

          {/* 수정 정보 표시 */}
          {(post.modifiedAt && post.modifiedAt !== post.createdAt) ||
          (post.modifiedAT && post.modifiedAT !== post.createdAt) ? (
              <div className="modified-info">
                <small>✏️ 수정: {formatDate(post.modifiedAt || post.modifiedAT)}</small>
              </div>
          ) : null}

          {/* 스폰서 특별 정보 */}
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