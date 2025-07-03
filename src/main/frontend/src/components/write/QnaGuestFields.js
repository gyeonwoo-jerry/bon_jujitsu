// 📁 components/write/QnaGuestFields.js (수정됨)
import React from 'react';

const QnaGuestFields = ({ formData, onChange, disabled = false }) => {
  // QnA 작성 모드 선택 (회원/비회원)
  const handleModeChange = (isGuest) => {
    onChange({ target: { name: 'isGuestPost', value: isGuest } });

    // 비회원에서 회원으로 변경시 게스트 정보 초기화
    if (!isGuest) {
      onChange({ target: { name: 'guestName', value: '' } });
      onChange({ target: { name: 'guestPassword', value: '' } });
    }
  };

  return (
      <div className="qna-guest-section">
        {/* 작성 모드 선택 */}
        <div className="form-group">
          <label>작성 모드</label>
          <div className="qna-type-selector">
            <label className="radio-label">
              <input
                  type="radio"
                  name="qnaType"
                  value="member"
                  checked={!formData.isGuestPost}
                  onChange={() => handleModeChange(false)}
                  disabled={disabled}
              />
              회원 작성
            </label>
            <label className="radio-label">
              <input
                  type="radio"
                  name="qnaType"
                  value="guest"
                  checked={formData.isGuestPost}
                  onChange={() => handleModeChange(true)}
                  disabled={disabled}
              />
              비회원 작성
            </label>
          </div>
        </div>

        {/* 비회원 작성시에만 표시 */}
        {formData.isGuestPost && (
            <div className="guest-fields">
              <div className="form-group">
                <label htmlFor="guestName">이름 *</label>
                <input
                    type="text"
                    id="guestName"
                    name="guestName"
                    value={formData.guestName}
                    onChange={onChange}
                    placeholder="이름을 입력해주세요"
                    maxLength={20}
                    required
                    disabled={disabled}
                />
              </div>
              <div className="form-group">
                <label htmlFor="guestPassword">비밀번호 *</label>
                <input
                    type="password"
                    id="guestPassword"
                    name="guestPassword"
                    value={formData.guestPassword}
                    onChange={onChange}
                    placeholder="비밀번호를 입력해주세요 (4자 이상)"
                    maxLength={20}
                    required
                    disabled={disabled}
                />
                <div className="password-info">
                  * 비회원 작성시 수정/삭제를 위해 비밀번호가 필요합니다.
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default QnaGuestFields;  // ← Default Export로 변경