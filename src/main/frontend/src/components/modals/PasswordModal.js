import React from 'react';

const PasswordModal = ({
  show,
  passwordInput,
  onPasswordChange,
  onConfirm,
  onClose,
  action
}) => {
  if (!show) return null;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onConfirm();
    }
  };

  return (
      <div className="password-modal-overlay" onClick={onClose}>
        <div className="password-modal" onClick={(e) => e.stopPropagation()}>
          <h3>비밀번호 확인</h3>
          <p>작성시 입력한 비밀번호를 입력해주세요.</p>
          <input
              type="password"
              value={passwordInput}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              onKeyPress={handleKeyPress}
              autoFocus
          />
          <div className="password-modal-actions">
            <button onClick={onConfirm} className="btn-confirm">
              확인
            </button>
            <button onClick={onClose} className="btn-cancel">
              취소
            </button>
          </div>
        </div>
      </div>
  );
};

export default PasswordModal;