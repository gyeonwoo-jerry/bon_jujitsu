import React from 'react';

const ImageModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
      <div className="image-modal" onClick={onClose}>
        <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
          <img src={imageUrl} alt="확대된 이미지" />
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
  );
};

export default ImageModal;