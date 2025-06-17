import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchList.css";

function BranchList() {
  const [branches, setBranches] = useState([]);
  const [filteredBranches, setFilteredBranches] = useState([]);
  const [activeArea, setActiveArea] = useState("전체"); // 기본값을 '전체'로 설정
  const [loading, setLoading] = useState(true); // 로딩 상태 추가
  const [error, setError] = useState(null); // 오류 상태 추가
  const navigate = useNavigate(); // useNavigate 훅을 사용하여 네비게이션 기능을 가져옵니다.

  useEffect(() => {
    // API를 통해 모든 branch 데이터를 가져옵니다.
    setLoading(true);
    API.get("/branch/all?page=1&size=50") // 더 많은 데이터를 요청
      .then((response) => {
        if (response.status === 200) {
          if (response.data.success) {
            const branchData = response.data.content.list || [];
            console.log("Data fetched:", branchData);
            
            // null 값들을 필터링하고 안전한 데이터만 사용
            const safeBranchData = branchData.filter(branch => 
              branch !== null && 
              branch !== undefined && 
              typeof branch === 'object' &&
              branch?.owner?.name // owner.name이 있는 지부만 표시
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
    navigate(`/branches/${id}`); // 해당 지부의 ID로 이동합니다.
  };

  const handleTabClick = (area) => {
    setActiveArea(area);
    if (area === "전체") {
      setFilteredBranches(branches);
    } else {
      setFilteredBranches(branches.filter((branch) => 
        branch && branch.area === area && branch?.owner?.name
      ));
    }
  };

  // branches가 로드된 후에만 uniqueAreas를 계산합니다.
  const uniqueAreas =
    branches.length > 0
      ? ["전체", ...new Set(branches
          .filter(branch => branch && branch.area)
          .map((branch) => branch.area)
        )]
      : ["전체"];

  // 로딩 중 표시
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

  // 오류 표시
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

        <div className="tabs">
          {uniqueAreas.map((area) => (
            <button
              key={area}
              className={`tab ${activeArea === area ? "active" : ""}`}
              onClick={() => handleTabClick(area)}
            >
              {area}
            </button>
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
