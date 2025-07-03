import React, { useState, useRef } from 'react';

const ImageUploadEdit = ({
  existingImages = [],
  newImages = [],
  keepImageIds = [],
  onNewImagesChange,
  onKeepImageIdsChange,
  maxImages = 10,
  maxImageSize = 10 * 1024 * 1024,
  disabled = false
}) => {
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    const totalImages = keepImageIds.length + newImages.length + files.length;
    if (totalImages > maxImages) {
      alert(`이미지는 최대 ${maxImages}개까지 업로드할 수 있습니다.`);
      return;
    }

    const oversizedFiles = files.filter(file => file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const updatedNewImages = [...newImages, ...files];
    onNewImagesChange(updatedNewImages);

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews(prev => [...prev, {
          file: file,
          url: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveExistingImage = (imageId) => {
    const updatedKeepIds = keepImageIds.filter(id => id !== imageId);
    onKeepImageIdsChange(updatedKeepIds);
  };

  const handleRemoveNewImage = (index) => {
    const updatedNewImages = newImages.filter((_, i) => i !== index);
    const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);

    onNewImagesChange(updatedNewImages);
    setNewImagePreviews(updatedPreviews);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
      <div className="form-group">
        <label>이미지 첨부</label>

        <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
            disabled={disabled}
        />

        <div className="image-info-section">
          <button
              type="button"
              className="image-upload-button"
              onClick={handleUploadClick}
              disabled={disabled || (keepImageIds.length + newImages.length) >= maxImages}
          >
            새 이미지 추가
          </button>
          <div className="upload-info">
            * 이미지는 최대 {maxImages}개, 각 파일당 10MB 이하만 업로드 가능합니다.
          </div>
        </div>

        <div className="image-management-section">
          <h4>이미지 관리</h4>

          {/* 기존 이미지 표시 */}
          {existingImages.length > 0 && (
              <div>
                <h5>기존 이미지 ({existingImages.length}개)</h5>
                <div className="image-preview-container">
                  {existingImages.map((image, index) => (
                      <div
                          key={`existing-${index}`}
                          className={`image-preview ${!keepImageIds.includes(image.id) ? 'removed' : ''}`}
                      >
                        <img
                            src={image.url}
                            alt={`기존 이미지 ${index + 1}`}
                            onError={(e) => {
                              console.error('이미지 로드 실패:', image.url);
                              e.target.src = '/images/blank_img.png';
                            }}
                        />
                        <div className="image-tag">기존 [{image.id}]</div>
                        {keepImageIds.includes(image.id) ? (
                            <button
                                type="button"
                                className="remove-image"
                                onClick={() => handleRemoveExistingImage(image.id)}
                                disabled={disabled}
                                title="이미지 삭제"
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

          {/* 새 이미지 표시 */}
          {newImagePreviews.length > 0 && (
              <div>
                <h5>새로 추가할 이미지 ({newImagePreviews.length}개)</h5>
                <div className="image-preview-container">
                  {newImagePreviews.map((preview, index) => (
                      <div key={`new-${index}`} className="image-preview">
                        <img
                            src={preview.url}
                            alt={`새 이미지 ${index + 1}`}
                        />
                        <div className="image-tag">신규</div>
                        <button
                            type="button"
                            className="remove-image"
                            onClick={() => handleRemoveNewImage(index)}
                            disabled={disabled}
                            title="이미지 삭제"
                        >
                          ✕
                        </button>
                        <div className="image-name">{preview.name}</div>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* 이미지 개수 요약 표시 */}
          <div className="image-summary">
            <strong>이미지 현황:</strong> 기존 이미지 {keepImageIds.length}개 + 신규 이미지 {newImages.length}개 = 총 {keepImageIds.length + newImages.length}개
            {(keepImageIds.length + newImages.length > maxImages) && (
                <div style={{ color: 'red', marginTop: '5px' }}>
                  ⚠️ 이미지는 최대 {maxImages}개까지만 가능합니다!
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default ImageUploadEdit;