import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchList.css";

function BranchList() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [activeArea, setActiveArea] = useState("전체");
  const [activeCity, setActiveCity] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // 주소에서 시/군/구 추출하는 함수
  const extractCityFromAddress = (address) => {
    if (!address) return null;

    // 주소 패턴: "경기도 안산시 상록구 반석로 78 2층"
    const addressParts = address.split(' ');
    if (addressParts.length >= 2) {
      // 두 번째 부분이 시/군/구 정보 (예: "안산시", "화성시", "오산시")
      return addressParts[1];
    }
    return null;
  };

  useEffect(() => {
    setLoading(true);
    API.get("/branch/all?page=1&size=50")
    .then((response) => {
      if (response.status === 200) {
        if (response.data.success) {
          const branchData = response.data.content.list || [];
          console.log("Data fetched:", branchData);

          const safeBranchData = branchData.filter(branch =>
              branch !== null &&
              branch !== undefined &&
              typeof branch === 'object' &&
              branch?.owner?.name
          ).map(branch => ({
            ...branch,
            city: extractCityFromAddress(branch.address) // 시/군/구 정보 추가
          }));

          setBranches(safeBranchData);
          setFilteredBranches(safeBranchData);
        } else {
          throw new Error("지부 정보를 불러오는데 실패했습니다.");
        }
      }
      setLoading(false);
    })
    .catch((error) => {
      if (
          error.response &&
          error.response.data &&
          error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("지부 정보를 불러오는데 중 오류가 발생했습니다.");
      }
      setLoading(false);
    });
  }, []);

  const handleMoreClick = (id) => {
    navigate(`/branches/${id}`);
  };

  const handleAreaClick = (area) => {
    setActiveArea(area);
    setActiveCity(null);
    setOpenDropdown(null);

    if (area === "전체") {
      setFilteredBranches(branches);
    } else {
      setFilteredBranches(branches.filter((branch) =>
          branch && branch.area === area && branch?.owner?.name
      ));
    }
  };

  const handleCityClick = (area, city) => {
    setActiveArea(area);
    setActiveCity(city);
    setOpenDropdown(null);

    if (area === "경기도") {
      // 경기도는 시/군/구별로 필터링
      setFilteredBranches(branches.filter((branch) =>
          branch && branch.area === area && branch.city === city && branch?.owner?.name
      ));
    } else {
      // 서울, 인천 등은 region별로 필터링
      setFilteredBranches(branches.filter((branch) =>
          branch && branch.area === area && branch.region === city && branch?.owner?.name
      ));
    }
  };

  const toggleDropdown = (area) => {
    if (openDropdown === area) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(area);
    }
  };

  // 지역별로 그룹화된 데이터 생성 (경기도만 시/군/구 기준으로)
  const getAreaData = () => {
    const areaMap = new Map();

    branches.forEach(branch => {
      if (!branch || !branch.area) return;

      if (!areaMap.has(branch.area)) {
        areaMap.set(branch.area, new Map());
      }

      // 경기도만 시/군/구별로 분류, 나머지는 지역(region)별로 분류
      if (branch.area === "경기도" && branch.city) {
        const cityMap = areaMap.get(branch.area);
        if (!cityMap.has(branch.city)) {
          cityMap.set(branch.city, []);
        }
        cityMap.get(branch.city).push(branch);
      } else if (branch.area !== "경기도" && branch.region) {
        // 서울, 인천 등은 기존처럼 region별로 분류
        const cityMap = areaMap.get(branch.area);
        if (!cityMap.has(branch.region)) {
          cityMap.set(branch.region, []);
        }
        cityMap.get(branch.region).push(branch);
      }
    });

    const result = [];
    areaMap.forEach((cityMap, area) => {
      const cities = [];
      cityMap.forEach((branchList, cityOrRegion) => {
        cities.push({
          city: cityOrRegion,
          branches: branchList,
          count: branchList.length
        });
      });

      result.push({
        area,
        cities: cities.sort((a, b) => a.city.localeCompare(b.city)),
        totalCount: cities.reduce((sum, city) => sum + city.count, 0)
      });
    });

    return result.sort((a, b) => a.area.localeCompare(b.area));
  };

  const areaData = getAreaData();

  if (loading) {
    return (
        <div className="branchList_container">
          <div className="inner">
            <div className="section_title">본주짓수 전국 지부 소개</div>
            <div className="loading">데이터를 불러오는 중...</div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="branchList_container">
          <div className="inner">
            <div className="section_title">본주짓수 전국 지부 소개</div>
            <div className="error-message">{error}</div>
          </div>
        </div>
    );
  }

  return (
      <div className="branchList_container">
        <div className="inner">
          <div className="section_title">본주짓수 전국 지부 소개</div>

          <div className="hierarchical-tabs">
            {/* 전체 탭 */}
            <div className="tab-item">
              <button
                  className={`main-tab ${activeArea === "전체" ? "active" : ""}`}
                  onClick={() => handleAreaClick("전체")}
              >
                전체
              </button>
            </div>

            {/* 지역별 탭들 */}
            {areaData.map(({ area, cities, totalCount }) => (
                <div key={area} className="tab-item">
                  <button
                      className={`main-tab ${activeArea === area && !activeCity ? "active" : ""}`}
                      onClick={() => {
                        if (cities.length > 1) {
                          toggleDropdown(area);
                        } else {
                          handleAreaClick(area);
                        }
                      }}
                  >
                    {area}{totalCount > 1 ? ` (${totalCount})` : ''}
                    {cities.length > 1 && (
                        <span className={`dropdown-arrow ${openDropdown === area ? 'open' : ''}`}>
                    ▼
                  </span>
                    )}
                  </button>

                  {/* 드롭다운 메뉴 (시/군이 여러 개일 때만) */}
                  {cities.length > 1 && openDropdown === area && (
                      <div className="dropdown-menu">
                        <button
                            className={`dropdown-item ${activeArea === area && !activeCity ? "active" : ""}`}
                            onClick={() => handleAreaClick(area)}
                        >
                          전체 {area}{totalCount > 1 ? ` (${totalCount})` : ''}
                        </button>
                        {cities.map(({ city, count }) => (
                            <button
                                key={city}
                                className={`dropdown-item ${activeArea === area && activeCity === city ? "active" : ""}`}
                                onClick={() => handleCityClick(area, city)}
                            >
                              {city}{count > 1 ? ` (${count})` : ''}
                            </button>
                        ))}
                      </div>
                  )}
                </div>
            ))}
          </div>

          {/* 현재 선택된 필터 표시 */}
          <div className="filter-status">
            {activeArea === "전체" ? (
                <span>전체 지부{filteredBranches.length > 1 ? ` (${filteredBranches.length}개)` : ''}</span>
            ) : activeCity ? (
                <span>
                  {activeArea === "경기도" ?
                      `${activeArea} ${activeCity}${filteredBranches.length > 1 ? ` (${filteredBranches.length}개)` : ''}` :
                      `${activeArea} ${activeCity}${filteredBranches.length > 1 ? ` (${filteredBranches.length}개)` : ''}`
                  }
                </span>
            ) : (
                <span>{activeArea} 전체{filteredBranches.length > 1 ? ` (${filteredBranches.length}개)` : ''}</span>
            )}
          </div>

          {filteredBranches.length === 0 ? (
              <div className="no-branches">표시할 지부가 없습니다.</div>
          ) : (
              <ul>
                {filteredBranches
                .filter(branch => branch !== null && branch !== undefined)
                .map((branch) => (
                    <li className="branch_item" key={branch?.id || Math.random()}>
                      <div className="branch_item_title">
                        <div className="branch_item_title_tit">
                          <div className="gym_name">{branch?.region || "지역 정보 없음"}</div>
                          <div className="gym_area">
                            {branch?.area === "경기도" ?
                                `${branch?.area} ${branch?.city}` :
                                `${branch?.area}`
                            }
                          </div>
                        </div>
                        <button
                            className="branch_item_title_more"
                            onClick={() => branch?.id && handleMoreClick(branch.id)}
                        >
                          <img src="/images/icon_click_wt.png" alt="더보기" />
                        </button>
                      </div>
                      <div className="branch_info">
                        <div className="owner_name">
                          <font className="accent">Prof.</font>
                          {branch?.owner?.name || "이름 정보 없음"}
                        </div>
                        <div className="address">
                          <font className="accent">A.</font>
                          {branch?.address || "주소 정보 없음"}
                        </div>
                        <div className="phone">
                          <font className="accent">T.</font>
                          {branch?.owner?.phoneNum || "전화번호 정보 없음"}
                        </div>
                        <div className="sns">
                          <ul>
                            <li
                                className={`${branch?.owner?.sns1 ? "" : "display_none"}`}
                            >
                              <a
                                  href={branch?.owner?.sns1}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                <img src="/images/icon-facebook.png" alt="페이스북" />
                              </a>
                            </li>
                            <li
                                className={`${branch?.owner?.sns2 ? "" : "display_none"}`}
                            >
                              <a
                                  href={branch?.owner?.sns2}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                <img src="/images/icon-insta.png" alt="인스타그램" />
                              </a>
                            </li>
                            <li
                                className={`${branch?.owner?.sns3 ? "" : "display_none"}`}
                            >
                              <a
                                  href={branch?.owner?.sns3}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                <img src="/images/icon-blog.png" alt="블로그" />
                              </a>
                            </li>
                            <li
                                className={`${branch?.owner?.sns4 ? "" : "display_none"}`}
                            >
                              <a
                                  href={branch?.owner?.sns4}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                <img src="/images/icon-cafe.png" alt="카페" />
                              </a>
                            </li>
                            <li
                                className={`${branch?.owner?.sns5 ? "" : "display_none"}`}
                            >
                              <a
                                  href={branch?.owner?.sns5}
                                  target="_blank"
                                  rel="noopener noreferrer"
                              >
                                <img src="/images/icon-you-bk.png" alt="카페" />
                              </a>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </li>
                ))}
              </ul>
          )}
        </div>
      </div>
  );
}

export default BranchList;