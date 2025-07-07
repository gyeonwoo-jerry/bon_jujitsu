// AddressSearch.js - 개선된 버전 (우편번호 포함)
import React from 'react';
import "../../styles/admin/admin.css";

const AddressSearch = ({ onAddressSelect, selectedAddress }) => {
  // 시/도 매핑 객체
  const areaMapping = {
    '서울': '서울특별시',
    '부산': '부산광역시',
    '대구': '대구광역시',
    '인천': '인천광역시',
    '광주': '광주광역시',
    '대전': '대전광역시',
    '울산': '울산광역시',
    '세종': '세종특별자치시',
    '경기': '경기도',
    '강원': '강원특별자치도',
    '충북': '충청북도',
    '충남': '충청남도',
    '전북': '전북특별자치도',
    '전남': '전라남도',
    '경북': '경상북도',
    '경남': '경상남도',
    '제주': '제주특별자치도'
  };

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
        let address = data.roadAddress || data.jibunAddress;
        let sido = data.sido || ''; // 시/도 정보 추출
        let zonecode = data.zonecode || ''; // 우편번호 추출

        // 시/도 이름을 전체 이름으로 변환
        const fullSido = areaMapping[sido] || sido;

        // 전체 주소 조합 (시/도를 전체 이름으로 교체)
        let fullAddress = address.replace(sido, fullSido);

        // 상세 주소가 있다면 추가
        if (data.buildingName) {
          fullAddress += ` (${data.buildingName})`;
        }

        // 주소, 지역(전체 시/도 이름), 우편번호 정보 반환
        onAddressSelect(fullAddress, fullSido, zonecode);
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