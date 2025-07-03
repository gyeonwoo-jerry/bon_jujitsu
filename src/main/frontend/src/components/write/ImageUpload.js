import React, { useState, useRef } from 'react';

const ImageUpload = ({
  images = [],
  onImagesChange,
  maxImages = 10,
  maxImageSize = 10 * 1024 * 1024, // 10MB
  disabled = false
}) => {
  const [imagePreviews, setImagePreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // onImagesChange 함수 존재 여부 확인
    if (typeof onImagesChange !== 'function') {
      console.error('ImageUpload: onImagesChange prop이 함수가 아닙니다.');
      return;
    }

    // 최대 이미지 개수 체크
    if (images.length + files.length > maxImages) {
      alert(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }

    // 파일 크기 검증
    const oversizedFiles = files.filter(file => file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일 타입 검증
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 새 이미지들을 기존 이미지에 추가
    const newImages = [...images, ...files];
    onImagesChange(newImages);

    // 미리보기 생성
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          file: file,
          url: e.target.result,
          name: file.name
        });
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });

    // 파일 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    onImagesChange(newImages);
    setImagePreviews(newPreviews);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
      <div className="form-group">
        <label>이미지 첨부</label>

        <div className="image-upload-section">
          <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              disabled={disabled}
          />

          <button
              type="button"
              onClick={handleUploadClick}
              className="image-upload-button"
              disabled={disabled || images.length >= maxImages}
          >
            이미지 선택 ({images.length}/{maxImages})
          </button>

          <div className="upload-info">
            * 이미지는 최대 {maxImages}개, 각 파일당 10MB 이하만 업로드 가능합니다.
          </div>
        </div>

        {imagePreviews.length > 0 && (
            <div className="image-preview-container">
              {imagePreviews.map((preview, index) => (
                  <div key={index} className="image-preview-item">
                    <img
                        src={preview.url}
                        alt={`미리보기 ${index + 1}`}
                        className="preview-image"
                    />
                    <button
                        type="button"
                        onClick={() => handleImageRemove(index)}
                        className="image-remove-button"
                        disabled={disabled}
                    >
                      ×
                    </button>
                    <div className="image-name">{preview.name}</div>
                  </div>
              ))}
            </div>
        )}
      </div>
  );
};

export default ImageUpload;