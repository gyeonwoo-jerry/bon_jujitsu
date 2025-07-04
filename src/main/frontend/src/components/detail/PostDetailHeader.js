import React from 'react';

const PostDetailHeader = ({ postType, post, canEdit, onBack, onEdit, onDelete }) => {
  const shouldShowEditButtons = () => {
    // canEdit가 함수인 경우 호출, boolean인 경우 그대로 사용
    if (typeof canEdit === 'function') {
      return canEdit();
    }
    return canEdit;
  };

  return (
      <div className="board-detail-header">
        <button onClick={onBack} className="btn-back">
          ← 목록으로
        </button>

        {shouldShowEditButtons() && (
            <div className="board-actions">
              <button onClick={onEdit} className="btn-edit">
                수정
              </button>
              <button onClick={onDelete} className="btn-delete">
                삭제
              </button>
            </div>
        )}
      </div>
  );
};

export default PostDetailHeader;