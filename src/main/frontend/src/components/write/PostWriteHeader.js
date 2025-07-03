import React from 'react';

const PostWriteHeader = ({
  title,
  onCancel,
  onSubmit,
  isSubmitting = false,
  submitText = "작성 완료",
  cancelText = "취소"
}) => {
  return (
      <div className="write-header">
        <h1>{title}</h1>
        <div className="write-actions">
          <button
              type="button"
              onClick={onCancel}
              className="cancel-button"
              disabled={isSubmitting}
          >
            {cancelText}
          </button>
          <button
              type="submit"
              onClick={onSubmit}
              className="submit-button"
              disabled={isSubmitting}
          >
            {isSubmitting ? '작성 중...' : submitText}
          </button>
        </div>
      </div>
  );
};

export default PostWriteHeader;