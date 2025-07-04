import React from 'react';

const PostDetailContent = ({ post, postType, onImageClick }) => {
  return (
      <div className="board-content">
        <div className="content-text">
          {post.content.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
          ))}
        </div>

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

        {/* 이미지 섹션 */}
        {post.images && post.images.length > 0 && (
            <div className="board-images">
              <h4>첨부 이미지</h4>
              <div className="image-grid">
                {post.images.map((image, index) => (
                    <div key={image.id || index} className="image-item">
                      <img
                          src={image.url}
                          alt={`첨부 이미지 ${index + 1}`}
                          onClick={() => onImageClick(image.url)}
                          className="board-image"
                      />
                    </div>
                ))}
              </div>
            </div>
        )}
      </div>
  );
};

export default PostDetailContent;