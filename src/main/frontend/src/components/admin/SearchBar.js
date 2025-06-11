// 수정된 SearchBar.js - DB에 저장된 지역 기반 드롭다운
import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import "../../styles/admin/admin.css";

const SearchBar = ({
  searchKeyword,
  onSearchInputChange,
  onSearch,
  placeholder = "상품명을 입력하세요",
  showRegionDropdown = false, // 지역 드롭박스 표시 여부
  selectedRegion = "", // 선택된 지역
  onRegionChange = () => {}, // 지역 변경 핸들러
}) => {
  // 지역 목록 상태
  const [regions, setRegions] = useState(["전체"]);
  const [loadingRegions, setLoadingRegions] = useState(false);

  // 폼 제출 핸들러
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  // 컴포넌트 마운트 시 지역 목록 가져오기
  useEffect(() => {
    // 지역 드롭다운이 표시되는 경우에만 API 호출
    if (showRegionDropdown) {
      fetchRegions();
    }
  }, [showRegionDropdown]);

  // 지역 목록 가져오기
  const fetchRegions = async () => {
    setLoadingRegions(true);

    try {
      // 방법 1: 특별한 지역 목록 API가 있는 경우
      // const res = await API.get('/regions');
      // if (res.data?.success) {
      //   setRegions(["전체", ...res.data.content]);
      // }

      // 방법 2: 모든 지부 정보를 가져와서 지역 정보 추출
      const res = await API.get('/branch/all?page=1&size=100'); // 충분히 큰 size로 설정

      if (res.data?.success) {
        // 모든 지부의 고유한 지역 정보 추출
        const uniqueAreas = new Set();

        // "전체" 옵션 추가
        uniqueAreas.add("전체");

        // 각 지부의 지역(area) 정보 추출
        res.data.content.list.forEach(branch => {
          if (branch.area && branch.area.trim() !== '') {
            uniqueAreas.add(branch.area);
          }
        });

        // 지역 목록을 배열로 변환 및 정렬
        const areaList = Array.from(uniqueAreas).sort();

        // "전체"가 맨 앞에 오도록 재정렬
        if (areaList.includes("전체")) {
          const filteredList = areaList.filter(area => area !== "전체");
          setRegions(["전체", ...filteredList]);
        } else {
          setRegions(areaList);
        }
      }
    } catch (err) {
      console.error('지역 목록 가져오기 오류:', err);
      // 기본 지역 목록 사용
      setRegions([
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
      ]);
    } finally {
      setLoadingRegions(false);
    }
  };

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
                    disabled={loadingRegions}
                >
                  {loadingRegions ? (
                      <option>지역 로딩 중...</option>
                  ) : (
                      regions.map((region) => (
                          <option
                              key={region}
                              value={region === "전체" ? "" : region}
                          >
                            {region}
                          </option>
                      ))
                  )}
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