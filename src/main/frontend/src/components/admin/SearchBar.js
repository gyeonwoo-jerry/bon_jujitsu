import React from 'react';
import '../../styles/admin/searchBar.css';

const SearchBar = ({
  searchKeyword,
  onSearchInputChange,
  onSearch,
  placeholder = "상품명을 입력하세요",
  showRegionDropdown = false, // 지역 드롭박스 표시 여부
  selectedRegion = "", // 선택된 지역
  onRegionChange = () => {}, // 지역 변경 핸들러
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  // 한국 지역 목록
  const regions = [
    "전체",
    "서울특별시",
    "부산광역시",
    "인천광역시",
    "대구광역시",
    "대전광역시",
    "광주광역시",
    "울산광역시",
    "세종특별자치시",
    "경기도",
    "충청북도",
    "충청남도",
    "전라남도",
    "전라북도",
    "경상북도",
    "경상남도",
    "제주시",
    "강원도"
  ];

  return (
      <div className="search-bar">
        <form onSubmit={handleSubmit}>
          <div className="search-inputs">
            {/* 지역 드롭박스 (showRegionDropdown이 true일 때만 표시) */}
            {showRegionDropdown && (
                <select
                    value={selectedRegion}
                    onChange={(e) => onRegionChange(e.target.value)}
                    className="region-dropdown"
                >
                  {regions.map((region) => (
                      <option key={region} value={region === "전체" ? "" : region}>
                        {region}
                      </option>
                  ))}
                </select>
            )}

            <input
                type="text"
                value={searchKeyword}
                onChange={onSearchInputChange}
                placeholder={placeholder}
                className="search-input"
            />

            <button type="submit" className="search-button">
              조회
            </button>
          </div>
        </form>
      </div>
  );
};

export default SearchBar;