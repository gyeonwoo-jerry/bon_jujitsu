import React from 'react';

const SponsorFields = ({ formData, onChange, disabled = false }) => {
  return (
      <div className="sponsor-fields">
        <h3>제휴업체 정보</h3>
        <div className="form-group">
          <label htmlFor="url">웹사이트 URL</label>
          <input
              type="text"
              id="url"
              name="url"
              value={formData.url}
              onChange={onChange}
              placeholder="예: www.youtube.com 또는 https://www.youtube.com"
              disabled={disabled}
          />
          <div className="field-info">
            * 제휴업체의 공식 웹사이트 주소를 입력해주세요. (http:// 또는 https:// 생략 가능)
          </div>
        </div>
      </div>
  );
};

export default SponsorFields;