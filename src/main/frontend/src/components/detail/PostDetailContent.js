import React, { useState } from 'react';

const PostDetailContent = ({ post, postType, onImageClick, normalizeImageUrl }) => {
  const [imageLoadInfo, setImageLoadInfo] = useState({});

  // 이미지 로드 완료 시 크기 정보 저장
  const handleImageLoad = (index, event) => {
    const img = event.target;
    const aspectRatio = img.naturalHeight / img.naturalWidth;

    setImageLoadInfo(prev => ({
      ...prev,
      [index]: {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: aspectRatio,
        isVeryTall: aspectRatio > 2 // 세로가 가로의 2배 이상이면 매우 긴 이미지로 판단
      }
    }));
  };

  // 미디어 타입별 렌더링
  const renderMedia = (media, index) => {
    const normalizedUrl = normalizeImageUrl ? normalizeImageUrl(media.url) : media.url;
    const imageInfo = imageLoadInfo[index];

    if (media.mediaType === 'VIDEO') {
      return (
          <div key={media.id || index} className="media-item video-item">
            <div className="media-type-badge">
              🎬 동영상
            </div>
            <video
                src={normalizedUrl}
                controls
                className="board-video"
                preload="metadata"
            >
              동영상을 재생할 수 없습니다.
            </video>
            {media.originalFileName && (
                <div className="media-filename">{media.originalFileName}</div>
            )}
          </div>
      );
    } else {
      return (
          <div key={media.id || index} className="media-item image-item">
            <div className="media-type-badge">📷 이미지</div>
            <img
                src={normalizedUrl}
                alt={`첨부 이미지 ${index + 1}`}
                className={`board-image-full ${imageInfo?.isVeryTall ? 'height-limited' : ''}`}
                onLoad={(e) => handleImageLoad(index, e)}
                onError={(e) => {
                  e.target.src = "/images/blank_img.png";
                }}
                onClick={() => onImageClick && onImageClick(normalizedUrl)}
                style={{
                  cursor: onImageClick ? 'pointer' : 'default'
                }}
            />
            {media.originalFileName && (
                <div className="media-filename">
                  {media.originalFileName}
                  {imageInfo && (
                      <span className="image-dimensions">
                      {` (${imageInfo.width} × ${imageInfo.height})`}
                    </span>
                  )}
                </div>
            )}
          </div>
      );
    }
  };

  // 미디어 개수 통계
  const getMediaStats = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageCount = post.images.filter(media => media.mediaType === 'IMAGE' || !media.mediaType).length;
    const videoCount = post.images.filter(media => media.mediaType === 'VIDEO').length;

    if (imageCount > 0 && videoCount > 0) {
      return `첨부 미디어 (이미지 ${imageCount}개, 동영상 ${videoCount}개)`;
    } else if (videoCount > 0) {
      return `첨부 동영상 (${videoCount}개)`;
    } else {
      return `첨부 이미지 (${imageCount}개)`;
    }
  };

  // HTML 콘텐츠인지 확인하는 함수
  const isHtmlContent = (content) => {
    return content && content.includes('<') && content.includes('>');
  };

  return (
      <div className="board-content">
        {/* 콘텐츠 렌더링 */}
        {isHtmlContent(post.content) ? (
            <div
                className="content-html"
                dangerouslySetInnerHTML={{ __html: post.content }}
            />
        ) : (
            <div className="content-text">
              {post.content.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
              ))}
            </div>
        )}

        {/* 제휴업체 특별 정보 표시 */}
        {postType === 'sponsor' && post.url && (
            <div className="sponsor-website-info">
              <h4>웹사이트</h4>
              <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sponsor-website-link"
              >
                🌐 {post.url}
              </a>
            </div>
        )}

        {/* 미디어 섹션 (이미지 + 동영상) */}
        {post.images && post.images.length > 0 && (
            <div className="board-media">
              <h4>{getMediaStats()}</h4>
              <div className="media-grid">
                {post.images.map((media, index) => renderMedia(media, index))}
              </div>
            </div>
        )}
      </div>
  );
};

export default PostDetailContent;