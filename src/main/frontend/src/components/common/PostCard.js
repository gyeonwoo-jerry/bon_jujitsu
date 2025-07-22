import React, { useState } from 'react';

const PostCard = ({
  post,
  type = 'skill',
  onClick,
  showRegion = false,
  maxContentLength = 80
}) => {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

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
    const textContent = text.replace(/<[^>]*>/g, '');
    return textContent.length > maxLength ? textContent.substring(0, maxLength) + '...' : textContent;
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

  // 미디어 파일 타입 확인 함수
  const isImageFile = (fileName, fileType) => {
    if (fileType && fileType.startsWith('image/')) return true;
    if (fileName) {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg'];
      return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }
    return false;
  };

  const isVideoFile = (fileName, fileType) => {
    if (fileType && fileType.startsWith('video/')) return true;
    if (fileName) {
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
      return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
    }
    return false;
  };

  // 첫 번째 미디어 파일 찾기
  const getFirstMedia = () => {
    // 기존 images 배열 확인 (하위 호환성)
    if (post.images && post.images.length > 0) {
      return {
        type: 'image',
        url: post.images[0].url,
        count: post.images.length
      };
    }

    // attachments 배열에서 미디어 파일 찾기
    if (post.attachments && post.attachments.length > 0) {
      // 이미지 파일 우선 검색
      const imageFile = post.attachments.find(file =>
          isImageFile(file.fileName, file.fileType)
      );

      if (imageFile) {
        const imageCount = post.attachments.filter(f => isImageFile(f.fileName, f.fileType)).length;
        return {
          type: 'image',
          url: imageFile.fileUrl || imageFile.url || `/uploads/${imageFile.fileName}`,
          fileName: imageFile.fileName,
          count: imageCount
        };
      }

      // 비디오 파일 검색
      const videoFile = post.attachments.find(file =>
          isVideoFile(file.fileName, file.fileType)
      );

      if (videoFile) {
        const videoCount = post.attachments.filter(f => isVideoFile(f.fileName, f.fileType)).length;
        return {
          type: 'video',
          url: videoFile.fileUrl || videoFile.url || `/uploads/${videoFile.fileName}`,
          fileName: videoFile.fileName,
          count: videoCount
        };
      }

      // 기타 파일이 있으면 파일 개수만 표시
      return {
        type: 'file',
        count: post.attachments.length
      };
    }

    return null;
  };

  // 미디어 렌더링
  const renderMediaContent = () => {
    const media = getFirstMedia();

    if (!media) {
      return (
          <div className="no-image">
            <span>{getDefaultIcon()}</span>
          </div>
      );
    }

    if (media.type === 'image' && !imageError) {
      return (
          <>
            <img
                src={media.url}
                alt={post.title || '이미지'}
                onError={(e) => {
                  console.log('이미지 로딩 실패:', media.url);
                  setImageError(true);
                  // 대체 이미지가 있다면 시도
                  if (e.target.src !== '/images/blank_img.png') {
                    e.target.src = '/images/blank_img.png';
                  }
                }}
                onLoad={() => setImageError(false)}
            />
            {media.count > 1 && (
                <div className="image-count-badge">
                  +{media.count - 1}
                </div>
            )}
          </>
      );
    }

    if (media.type === 'video' && !videoError) {
      return (
          <div className="video-container">
            <video
                src={media.url}
                onError={(e) => {
                  console.log('비디오 로딩 실패:', media.url);
                  setVideoError(true);
                }}
                muted
                preload="metadata"
                poster="" // 비디오 썸네일이 있다면 여기에 설정
            />
            <div className="video-overlay">
              <div className="play-icon">▶️</div>
            </div>
            {media.count > 1 && (
                <div className="image-count-badge">
                  +{media.count - 1}
                </div>
            )}
          </div>
      );
    }

    if (media.type === 'file') {
      return (
          <div className="no-image file-icon">
            <span>📎</span>
            <div className="file-info">
              {media.count}개 파일
            </div>
          </div>
      );
    }

    // 에러 발생 시 기본 아이콘 표시
    return (
        <div className="no-image">
          <span>{getDefaultIcon()}</span>
        </div>
    );
  };

  // 첨부파일 개수 및 타입 정보
  const getAttachmentInfo = () => {
    if (!post.attachments || post.attachments.length === 0) return null;

    const imageCount = post.attachments.filter(f => isImageFile(f.fileName, f.fileType)).length;
    const videoCount = post.attachments.filter(f => isVideoFile(f.fileName, f.fileType)).length;
    const otherCount = post.attachments.length - imageCount - videoCount;

    const parts = [];
    if (imageCount > 0) parts.push(`📷 ${imageCount}`);
    if (videoCount > 0) parts.push(`🎥 ${videoCount}`);
    if (otherCount > 0) parts.push(`📄 ${otherCount}`);

    return parts.join(' · ');
  };

  return (
      <div className={getCardClassName()} onClick={onClick}>
        <div className="card-image">
          {renderMediaContent()}
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
              {post.viewCount !== undefined && (
                  <span className="views">👁 {post.viewCount?.toLocaleString()}</span>
              )}
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

          {/* 첨부파일 정보 표시 */}
          {getAttachmentInfo() && (
              <div className="attachment-info">
            <span className="attachment-count">
              {getAttachmentInfo()}
            </span>
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