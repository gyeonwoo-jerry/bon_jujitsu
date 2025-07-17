import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchList.css";

function BranchList() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [activeArea, setActiveArea] = useState("전체");
  const [activeRegion, setActiveRegion] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 어떤 드롭다운이 열려있는지
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
          );

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
    setActiveRegion(null);
    setOpenDropdown(null);

    if (area === "전체") {
      setFilteredBranches(branches);
    } else {
      setFilteredBranches(branches.filter((branch) =>
          branch && branch.area === area && branch?.owner?.name
      ));
    }
  };

  const handleRegionClick = (area, region) => {
    setActiveArea(area);
    setActiveRegion(region);
    setOpenDropdown(null);

    setFilteredBranches(branches.filter((branch) =>
        branch && branch.area === area && branch.region === region && branch?.owner?.name
    ));
  };

  const toggleDropdown = (area) => {
    if (openDropdown === area) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(area);
    }
  };

  // 지역별로 그룹화된 데이터 생성
  const getAreaData = () => {
    const areaMap = new Map();

    branches.forEach(branch => {
      if (branch && branch.area && branch.region) {
        if (!areaMap.has(branch.area)) {
          areaMap.set(branch.area, new Set());
        }
        areaMap.get(branch.area).add(branch.region);
      }
    });

    const result = [];
    areaMap.forEach((regions, area) => {
      result.push({
        area,
        regions: Array.from(regions).sort()
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
            {areaData.map(({ area, regions }) => (
                <div key={area} className="tab-item">
                  <button
                      className={`main-tab ${activeArea === area && !activeRegion ? "active" : ""}`}
                      onClick={() => {
                        if (regions.length > 1) {
                          toggleDropdown(area);
                        } else {
                          handleAreaClick(area);
                        }
                      }}
                  >
                    {area}
                    {regions.length > 1 && (
                        <span className={`dropdown-arrow ${openDropdown === area ? 'open' : ''}`}>
                    ▼
                  </span>
                    )}
                  </button>

                  {/* 드롭다운 메뉴 (지역이 여러 개일 때만) */}
                  {regions.length > 1 && openDropdown === area && (
                      <div className="dropdown-menu">
                        <button
                            className={`dropdown-item ${activeArea === area && !activeRegion ? "active" : ""}`}
                            onClick={() => handleAreaClick(area)}
                        >
                          전체 {area}
                        </button>
                        {regions.map((region) => (
                            <button
                                key={region}
                                className={`dropdown-item ${activeArea === area && activeRegion === region ? "active" : ""}`}
                                onClick={() => handleRegionClick(area, region)}
                            >
                              {region}
                            </button>
                        ))}
                      </div>
                  )}
                </div>
            ))}
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
                          <div className="gym_area">{branch?.area || "지역 정보 없음"}</div>
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