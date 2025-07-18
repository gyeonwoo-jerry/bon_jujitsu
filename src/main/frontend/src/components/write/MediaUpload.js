import React, { useState, useRef } from 'react';

const MediaUpload = ({
  media = [],
  onMediaChange,
  maxMedia = 10,
  maxImageSize = 10 * 1024 * 1024, // 10MB
  maxVideoSize = 100 * 1024 * 1024, // 100MB
  disabled = false,
  allowVideo = false // 동영상 허용 여부
}) => {
  const [mediaPreviews, setMediaPreviews] = useState([]);
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

  const handleMediaSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // onMediaChange 함수 존재 여부 확인
    if (typeof onMediaChange !== 'function') {
      console.error('MediaUpload: onMediaChange prop이 함수가 아닙니다.');
      return;
    }

    // 최대 미디어 개수 체크
    if (media.length + files.length > maxMedia) {
      alert(`최대 ${maxMedia}개의 파일만 업로드할 수 있습니다.`);
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

    // 새 미디어들을 기존 미디어에 추가
    const newMedia = [...media, ...validFiles];
    onMediaChange(newMedia);

    // 미리보기 생성
    const newPreviews = [...mediaPreviews];
    validFiles.forEach(file => {
      const mediaType = getMediaType(file);

      if (mediaType === 'IMAGE') {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            file: file,
            url: e.target.result,
            name: file.name,
            type: 'IMAGE'
          });
          setMediaPreviews([...newPreviews]);
        };
        reader.readAsDataURL(file);
      } else if (mediaType === 'VIDEO') {
        newPreviews.push({
          file: file,
          url: URL.createObjectURL(file),
          name: file.name,
          type: 'VIDEO'
        });
        setMediaPreviews([...newPreviews]);
      }
    });

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMediaRemove = (index) => {
    const newMedia = media.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);

    onMediaChange(newMedia);
    setMediaPreviews(newPreviews);

    // 동영상 URL 메모리 해제
    const removedPreview = mediaPreviews[index];
    if (removedPreview && removedPreview.type === 'VIDEO') {
      URL.revokeObjectURL(removedPreview.url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 파일 크기를 읽기 쉽게 포맷
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // accept 속성 생성
  const getAcceptAttribute = () => {
    if (allowVideo) {
      return "image/*,video/*";
    }
    return "image/*";
  };

  return (
      <div className="form-group">
        <label>{allowVideo ? '미디어 첨부 (이미지/동영상)' : '이미지 첨부'}</label>

        <div className="media-upload-section">
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaSelect}
              multiple
              accept={getAcceptAttribute()}
              style={{ display: 'none' }}
              disabled={disabled}
          />

          <button
              type="button"
              onClick={handleUploadClick}
              className="media-upload-button"
              disabled={disabled || media.length >= maxMedia}
          >
            {allowVideo ? '파일 선택' : '이미지 선택'} ({media.length}/{maxMedia})
          </button>

          <div className="upload-info">
            <p>* 최대 {maxMedia}개까지 업로드 가능합니다.</p>
            <p>* 이미지: {Math.round(maxImageSize / 1024 / 1024)}MB 이하 (jpg, png, gif, webp 등)</p>
            {allowVideo && (
                <p>* 동영상: {Math.round(maxVideoSize / 1024 / 1024)}MB 이하 (mp4, avi, mov, webm 등)</p>
            )}
          </div>
        </div>

        {mediaPreviews.length > 0 && (
            <div className="media-preview-container">
              {mediaPreviews.map((preview, index) => (
                  <div key={index} className="media-preview-item">
                    <div className="media-type-badge">
                      {preview.type === 'IMAGE' ? '📷' : '🎬'} {preview.type}
                    </div>

                    {preview.type === 'IMAGE' ? (
                        <img
                            src={preview.url}
                            alt={`미리보기 ${index + 1}`}
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

                    <button
                        type="button"
                        onClick={() => handleMediaRemove(index)}
                        className="media-remove-button"
                        disabled={disabled}
                    >
                      ×
                    </button>

                    <div className="media-info">
                      <div className="media-name">{preview.name}</div>
                      <div className="media-size">{formatFileSize(preview.file.size)}</div>
                    </div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default MediaUpload;