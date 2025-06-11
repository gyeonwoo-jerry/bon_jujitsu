// AddressSearch.js - 수정된 버전
import React from 'react';
import "../../styles/admin/admin.css";

const AddressSearch = ({ onAddressSelect, selectedAddress }) => {
  // 주소 검색 팝업 열기
  const openAddressSearch = () => {
    // 주소 검색 스크립트가 로드되지 않았다면 로드
    if (!window.daum || !window.daum.Postcode) {
      const script = document.createElement('script');
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => {
        openPostcode();
      };
      document.head.appendChild(script);
    } else {
      openPostcode();
    }
  };

  // 주소 검색 창 열기
  const openPostcode = () => {
    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddress = data.roadAddress || data.jibunAddress;
        let area = data.sido || ''; // 시/도 정보 추출

        // 상세 주소가 있다면 추가
        if (data.buildingName) {
          fullAddress += ` (${data.buildingName})`;
        }

        // 주소와 지역(시/도) 정보 반환
        onAddressSelect(fullAddress, area);
      }
    }).open();
  };

  return (
      <div className="address-search-container">
        <div className="address-input-container">
          <input
              type="text"
              value={selectedAddress}
              className="address-input"
              placeholder="주소를 검색해주세요"
              readOnly
              required
          />
          <button
              type="button"
              className="address-search-button"
              onClick={openAddressSearch}
          >
            주소 검색
          </button>
        </div>
      </div>
  );
};

export default AddressSearch;