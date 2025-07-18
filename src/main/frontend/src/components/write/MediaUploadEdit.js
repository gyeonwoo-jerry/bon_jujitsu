import React, { useState, useRef } from 'react';

const MediaUploadEdit = ({
  existingMedia = [],
  newMedia = [],
  keepMediaIds = [],
  onNewMediaChange,
  onKeepMediaIdsChange,
  maxMedia = 10,
  maxImageSize = 10 * 1024 * 1024,
  maxVideoSize = 100 * 1024 * 1024,
  allowVideo = true,
  disabled = false
}) => {
  const [newMediaPreviews, setNewMediaPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // 지원되는 파일 확장자
  const allowedImageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
  const allowedVideoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v'];

  // 파일 타입 결정
  const getMediaType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    if (allowedImageExtensions.includes(extension)) {
      return 'IMAGE';
    } else if (allowedVideoExtensions.includes(extension)) {
      return 'VIDEO';
    }
    return 'UNKNOWN';
  };

  // 파일 크기 체크
  const checkFileSize = (file) => {
    const mediaType = getMediaType(file);
    if (mediaType === 'IMAGE' && file.size > maxImageSize) {
      return `이미지 파일 크기는 ${Math.round(maxImageSize / 1024 / 1024)}MB를 초과할 수 없습니다.`;
    } else if (mediaType === 'VIDEO' && file.size > maxVideoSize) {
      return `동영상 파일 크기는 ${Math.round(maxVideoSize / 1024 / 1024)}MB를 초과할 수 없습니다.`;
    }
    return null;
  };

  // accept 속성 생성
  const getAcceptAttribute = () => {
    if (allowVideo) {
      return "image/*,video/*";
    }
    return "image/*";
  };

  // 파일 크기를 읽기 쉽게 포맷
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const totalMedia = keepMediaIds.length + newMedia.length + files.length;
    if (totalMedia > maxMedia) {
      alert(`미디어는 최대 ${maxMedia}개까지 업로드할 수 있습니다.`);
      return;
    }

    // 파일 검증
    const validationErrors = [];
    const validFiles = [];

    files.forEach(file => {
      const mediaType = getMediaType(file);

      // 파일 타입 검증
      if (mediaType === 'UNKNOWN') {
        const allowedExtensions = allowVideo
            ? [...allowedImageExtensions, ...allowedVideoExtensions]
            : allowedImageExtensions;
        validationErrors.push(`${file.name}: 지원되지 않는 파일 형식입니다. (지원: ${allowedExtensions.join(', ')})`);
        return;
      }

      // 동영상 허용 여부 확인
      if (mediaType === 'VIDEO' && !allowVideo) {
        validationErrors.push(`${file.name}: 동영상 파일은 업로드할 수 없습니다.`);
        return;
      }

      // 파일 크기 검증
      const sizeError = checkFileSize(file);
      if (sizeError) {
        validationErrors.push(`${file.name}: ${sizeError}`);
        return;
      }

      validFiles.push(file);
    });

    // 검증 에러가 있으면 알림
    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      if (validFiles.length === 0) return;
    }

    const updatedNewMedia = [...newMedia, ...validFiles];
    onNewMediaChange(updatedNewMedia);

    validFiles.forEach(file => {
      const mediaType = getMediaType(file);

      if (mediaType === 'IMAGE') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setNewMediaPreviews(prev => [...prev, {
            file: file,
            url: e.target.result,
            name: file.name,
            type: 'IMAGE'
          }]);
        };
        reader.readAsDataURL(file);
      } else if (mediaType === 'VIDEO') {
        setNewMediaPreviews(prev => [...prev, {
          file: file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: 'VIDEO'
        }]);
      }
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingMedia = (mediaId) => {
    const updatedKeepIds = keepMediaIds.filter(id => id !== mediaId);
    onKeepMediaIdsChange(updatedKeepIds);
  };

  const handleRemoveNewMedia = (index) => {
    const updatedNewMedia = newMedia.filter((_, i) => i !== index);
    const updatedPreviews = newMediaPreviews.filter((_, i) => i !== index);

    onNewMediaChange(updatedNewMedia);
    setNewMediaPreviews(updatedPreviews);

    // 동영상 URL 메모리 해제
    const removedPreview = newMediaPreviews[index];
    if (removedPreview && removedPreview.type === 'VIDEO') {
      URL.revokeObjectURL(removedPreview.url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
      <div className="form-group">
        <label>{allowVideo ? '미디어 첨부 (이미지/동영상)' : '이미지 첨부'}</label>

        <input
            type="file"
            accept={getAcceptAttribute()}
            multiple
            onChange={handleMediaSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
            disabled={disabled}
        />

        <div className="media-info-section">
          <button
              type="button"
              className="media-upload-button"
              onClick={handleUploadClick}
              disabled={disabled || (keepMediaIds.length + newMedia.length) >= maxMedia}
          >
            새 미디어 추가
          </button>
          <div className="upload-info">
            <p>* 최대 {maxMedia}개까지 업로드 가능합니다.</p>
            <p>* 이미지: {Math.round(maxImageSize / 1024 / 1024)}MB 이하 (jpg, png, gif, webp 등)</p>
            {allowVideo && (
                <p>* 동영상: {Math.round(maxVideoSize / 1024 / 1024)}MB 이하 (mp4, avi, mov, webm 등)</p>
            )}
          </div>
        </div>

        <div className="media-management-section">
          <h4>미디어 관리</h4>

          {/* 기존 미디어 표시 */}
          {existingMedia.length > 0 && (
              <div>
                <h5>기존 미디어 ({existingMedia.length}개)</h5>
                <div className="media-preview-container">
                  {existingMedia.map((media, index) => (
                      <div
                          key={`existing-${index}`}
                          className={`media-preview ${!keepMediaIds.includes(media.id) ? 'removed' : ''}`}
                      >
                        <div className="media-type-badge">
                          {media.mediaType === 'IMAGE' ? '📷' : '🎬'} {media.mediaType}
                        </div>

                        {media.mediaType === 'IMAGE' ? (
                            <img
                                src={media.url}
                                alt={`기존 미디어 ${index + 1}`}
                                className="preview-media"
                                onError={(e) => {
                                  console.error('미디어 로드 실패:', media.url);
                                  e.target.src = '/images/blank_img.png';
                                }}
                            />
                        ) : (
                            <video
                                src={media.url}
                                className="preview-media"
                                controls
                                muted
                            >
                              브라우저에서 동영상을 지원하지 않습니다.
                            </video>
                        )}

                        <div className="media-tag">기존 [{media.id}]</div>
                        {keepMediaIds.includes(media.id) ? (
                            <button
                                type="button"
                                className="remove-media"
                                onClick={() => handleRemoveExistingMedia(media.id)}
                                disabled={disabled}
                                title="미디어 삭제"
                            >
                              ✕
                            </button>
                        ) : (
                            <div className="removed-tag">삭제됨</div>
                        )}
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* 새 미디어 표시 */}
          {newMediaPreviews.length > 0 && (
              <div>
                <h5>새로 추가할 미디어 ({newMediaPreviews.length}개)</h5>
                <div className="media-preview-container">
                  {newMediaPreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="media-preview">
                        <div className="media-type-badge">
                          {preview.type === 'IMAGE' ? '📷' : '🎬'} {preview.type}
                        </div>

                        {preview.type === 'IMAGE' ? (
                            <img
                                src={preview.url}
                                alt={`새 미디어 ${index + 1}`}
                                className="preview-media"
                            />
                        ) : (
                            <video
                                src={preview.url}
                                className="preview-media"
                                controls
                                muted
                            >
                              브라우저에서 동영상을 지원하지 않습니다.
                            </video>
                        )}

                        <div className="media-tag">신규</div>
                        <button
                            type="button"
                            className="remove-media"
                            onClick={() => handleRemoveNewMedia(index)}
                            disabled={disabled}
                            title="미디어 삭제"
                        >
                          ✕
                        </button>
                        <div className="media-info">
                          <div className="media-name">{preview.name}</div>
                          <div className="media-size">{formatFileSize(preview.file.size)}</div>
                        </div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* 미디어 개수 요약 표시 */}
          <div className="media-summary">
            <strong>미디어 현황:</strong> 기존 미디어 {keepMediaIds.length}개 + 신규 미디어 {newMedia.length}개 = 총 {keepMediaIds.length + newMedia.length}개
            {(keepMediaIds.length + newMedia.length > maxMedia) && (
                <div style={{ color: 'red', marginTop: '5px' }}>
                  ⚠️ 미디어는 최대 {maxMedia}개까지만 가능합니다!
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default MediaUploadEdit;