import React, { useState, useEffect } from "react";
import MemberTable from "../../components/admin/MemberTable";
import Pagination from "../../components/admin/Pagination";
import AdminHeader from "../../components/admin/AdminHeader";
import API from "../../utils/api";
import "../../styles/admin/memberManagement.css"; // CSS 파일 import

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  // OWNER용 지부 관리
  const [userBranchIds, setUserBranchIds] = useState([]); // OWNER가 관리하는 지부 ID들
  const [userBranches, setUserBranches] = useState([]); // OWNER가 관리하는 지부 정보들
  const [selectedOwnerBranch, setSelectedOwnerBranch] = useState(""); // OWNER가 선택한 지부

  // ADMIN용 지부 region 목록
  const [regions, setRegions] = useState([]);
  const [allBranches, setAllBranches] = useState([]); // 모든 지부 정보 저장
  const [selectedRegion, setSelectedRegion] = useState("");
  const [regionsLoading, setRegionsLoading] = useState(false);

  // OWNER용 활성 탭 상태
  const [activeTab, setActiveTab] = useState("PENDING");

  // 검색 조건 상태
  const [filters, setFilters] = useState({
    name: "",
    role: "",
  });

  // 지부 목록을 가져와서 고유한 region 추출 (ADMIN 권한일 때만)
  const fetchRegions = async () => {
    setRegionsLoading(true);
    try {
      const res = await API.get("/branch/all?page=1&size=1000"); // 모든 브랜치 가져오기
      if (res.data?.success) {
        const branches = res.data.content?.list || [];
        setAllBranches(branches); // 모든 지부 정보 저장

        // 중복되지 않는 region 값들만 추출
        const uniqueRegions = [...new Set(branches.map(branch => branch.region))];
        setRegions(uniqueRegions.sort()); // 알파벳 순으로 정렬
        console.log("고유한 지부 region 목록:", uniqueRegions);
        console.log("모든 지부 정보:", branches);
      } else {
        console.error("브랜치 목록 조회 실패:", res.data?.message);
      }
    } catch (err) {
      console.error("브랜치 목록 조회 오류:", err);
    } finally {
      setRegionsLoading(false);
    }
  };

  // 사용자 정보 로드 및 초기 데이터 로드
  useEffect(() => {
    const loadUserInfo = () => {
      try {
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
          const parsedInfo = JSON.parse(userInfo);
          const role = parsedInfo.role || "";
          setUserRole(role);

          if (role === "OWNER") {
            // OWNER인 경우 지부 정보 처리
            const branchIds = parsedInfo.branchIds || (parsedInfo.branchId ? [parsedInfo.branchId] : []);
            const branches = parsedInfo.branches || [];

            setUserBranchIds(branchIds);
            setUserBranches(branches);

            console.log("OWNER 지부 정보:", { branchIds, branches });

            // OWNER인 경우 초기 로드 시 바로 PENDING 회원 조회
            setTimeout(() => {
              setIsSearched(true);
              fetchMembers(1);
            }, 200);
          } else if (role === "ADMIN") {
            // ADMIN인 경우 지부 region 목록 로드 및 전체 회원 조회
            setTimeout(() => {
              fetchRegions();
              setIsSearched(true);
              fetchMembers(1);
            }, 200);
          }
        }
      } catch (error) {
        console.error("사용자 정보 로드 오류:", error);
      }
    };

    loadUserInfo();
  }, []);

  // region 선택 핸들러 (ADMIN용)
  const handleRegionClick = (region) => {
    setSelectedRegion(prevRegion => prevRegion === region ? "" : region);
    setCurrentPage(1);
  };

  // OWNER 지부 선택 핸들러
  const handleOwnerBranchChange = (e) => {
    setSelectedOwnerBranch(e.target.value);
    setCurrentPage(1);
  };

  // 검색 조건 변경 핸들러
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // 회원 데이터 가져오기
  const fetchMembers = async (page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = showDeleted ? "/admin/users/deleted" : "/admin/users";

      const params = new URLSearchParams({
        page: page,
        size: 10,
      });

      // 삭제된 회원 보기가 아닌 경우에만 검색 조건 추가
      if (!showDeleted) {
        // 이름 검색
        if (filters.name && filters.name.trim() !== "") {
          params.append("name", filters.name.trim());
        }

        // 역할 검색
        if (userRole === "OWNER") {
          params.append("role", activeTab);
        } else if (userRole === "ADMIN" && filters.role && filters.role.trim() !== "") {
          params.append("role", filters.role.trim());
        }

        // 지부 검색
        if (userRole === "OWNER") {
          if (userBranches.length === 1) {
            // 하나의 지부만 관리하는 경우
            params.append("branchId", userBranches[0].id);
          } else if (userBranches.length > 1) {
            // 여러 지부를 관리하는 경우
            if (selectedOwnerBranch) {
              params.append("branchId", selectedOwnerBranch);
            }
            // 전체 선택인 경우 특별한 처리가 필요하면 여기에 추가
          }
        } else if (userRole === "ADMIN" && selectedRegion) {
          // ADMIN인 경우 선택된 region에 해당하는 지부들의 ID를 찾아서 전송
          const selectedBranches = allBranches.filter(branch => branch.region === selectedRegion);
          console.log(`선택된 region "${selectedRegion}"에 해당하는 지부들:`, selectedBranches);

          if (selectedBranches.length === 1) {
            // 해당 region에 지부가 하나만 있는 경우
            params.append("branchId", selectedBranches[0].id);
          } else if (selectedBranches.length > 1) {
            // 해당 region에 여러 지부가 있는 경우 (같은 region명을 가진 지부들)
            // 백엔드가 branchIds 배열을 지원하는지 확인 필요
            selectedBranches.forEach(branch => {
              params.append("branchIds", branch.id);
            });
          }
        }
      }

      console.log(`API 요청 URL: ${endpoint}?${params.toString()}`);

      const res = await API.get(`${endpoint}?${params.toString()}`);
      console.log("API 응답 데이터:", res.data);

      if (res.data && res.data.success && res.data.content) {
        const { list, totalPage, page: currentPageFromServer } = res.data.content;
        setMembers(list || []);
        setTotalPages(totalPage || 0);
        setCurrentPage(currentPageFromServer || page);
        setIsSearched(true);
      } else {
        console.error("예상치 못한 응답 구조:", res.data);
        setMembers([]);
        setTotalPages(0);
        setIsSearched(true);
      }
    } catch (err) {
      console.error("회원 조회 실패:", err);
      console.error("에러 세부 정보:", err.response?.data || err.message);
      setMembers([]);
      setTotalPages(0);
      setIsSearched(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 삭제된 회원 토글 시 데이터 로드
  useEffect(() => {
    if (showDeleted || isSearched) {
      fetchMembers(1);
    }
  }, [showDeleted]);

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    if (isSearched) {
      fetchMembers(currentPage);
    }
  }, [currentPage]);

  // OWNER 탭 변경 시 데이터 로드
  useEffect(() => {
    if (userRole === "OWNER" && isSearched) {
      setCurrentPage(1);
      fetchMembers(1);
    }
  }, [activeTab]);

  // ADMIN region 변경 시 데이터 로드
  useEffect(() => {
    if (userRole === "ADMIN" && isSearched) {
      fetchMembers(1);
    }
  }, [selectedRegion]);

  // OWNER 지부 선택 변경 시 데이터 로드
  useEffect(() => {
    if (userRole === "OWNER" && isSearched && userBranches.length > 1) {
      fetchMembers(1);
    }
  }, [selectedOwnerBranch]);

  // 검색 버튼 핸들러
  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers(1);
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      name: "",
      role: "",
    });

    if (userRole === "OWNER") {
      setActiveTab("PENDING");
      setSelectedOwnerBranch("");
    } else if (userRole === "ADMIN") {
      setSelectedRegion("");
    }
  };

  // OWNER용 탭 데이터
  const ownerTabs = [
    { key: "PENDING", label: "대기중" },
    { key: "USER", label: "회원" },
    { key: "COACH", label: "코치" },
  ];

  return (
      <div className="member-manage-container">
        <AdminHeader />

        <div className="member-manage-wrapper">
          {/* 헤더 섹션 */}
          <div className="page-header">
            <h1 className="page-title">회원관리</h1>
            <button
                onClick={() => {
                  setShowDeleted(!showDeleted);
                  setCurrentPage(1);
                }}
                className={`btn-toggle ${showDeleted ? 'active' : 'inactive'}`}
            >
            <span className="btn-icon">
              {showDeleted ? '👥' : '🗑️'}
            </span>
              {showDeleted ? "회원리스트 보기" : "삭제된 회원 보기"}
            </button>
          </div>

          {/* ADMIN인 경우 지부 region 탭들 표시 */}
          {userRole === "ADMIN" && !showDeleted && (
              <div className="region-tabs">
                <div className="region-tabs-header">
                  <span className="region-tabs-label">지부별 조회:</span>
                  {regionsLoading && <span className="loading-text">지부 목록 로딩 중...</span>}
                </div>
                <div className="region-buttons">
                  <button
                      className={`region-button ${selectedRegion === "" ? 'active' : ''}`}
                      onClick={() => handleRegionClick("")}
                  >
                    전체
                  </button>
                  {regions.map((region) => (
                      <button
                          key={region}
                          className={`region-button ${selectedRegion === region ? 'active' : ''}`}
                          onClick={() => handleRegionClick(region)}
                      >
                        {region}
                      </button>
                  ))}
                </div>
              </div>
          )}

          {/* OWNER인 경우 지부 선택 및 탭 UI */}
          {userRole === "OWNER" && !showDeleted && (
              <>
                {/* OWNER가 여러 지부를 관리하는 경우에만 지부 선택 드롭다운 표시 */}
                {userBranches.length > 1 && (
                    <div className="owner-branch-selector">
                      <label className="branch-selector-label">관리 지부 선택:</label>
                      <select
                          value={selectedOwnerBranch}
                          onChange={handleOwnerBranchChange}
                          className="form-select"
                      >
                        <option value="">전체 관리 지부</option>
                        {userBranches.map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.region} ({branch.area})
                            </option>
                        ))}
                      </select>
                    </div>
                )}

                {/* OWNER 탭 */}
                <div className="owner-tabs">
                  {ownerTabs.map((tab) => (
                      <button
                          key={tab.key}
                          className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.key)}
                      >
                        {tab.label}
                      </button>
                  ))}
                </div>
              </>
          )}

          {/* 검색 영역 */}
          {!showDeleted && (
              <div className="search-panel">
                <div className="search-form">
                  <div className="form-group">
                    <label className="form-label">이름</label>
                    <input
                        name="name"
                        placeholder="회원 이름 검색"
                        value={filters.name}
                        onChange={handleChange}
                        className="form-input"
                    />
                  </div>

                  {/* 관리자만 회원 등급 필터 표시 */}
                  {userRole === "ADMIN" && (
                      <div className="form-group">
                        <label className="form-label">회원 등급</label>
                        <select
                            name="role"
                            value={filters.role}
                            onChange={handleChange}
                            className="form-select"
                        >
                          <option value="">전체 등급</option>
                          <option value="PENDING">대기중</option>
                          <option value="USER">일반 회원</option>
                          <option value="COACH">코치</option>
                          <option value="OWNER">지부장</option>
                        </select>
                      </div>
                  )}
                </div>

                <div className="btn-actions">
                  <button
                      onClick={handleSearch}
                      className="btn btn-primary"
                      disabled={isLoading}
                  >
                    {isLoading ? '로딩 중...' : '검색'}
                  </button>
                  <button
                      onClick={resetFilters}
                      className="btn btn-secondary"
                  >
                    초기화
                  </button>
                </div>
              </div>
          )}

          {/* 현재 선택된 조건 표시 */}
          {userRole === "ADMIN" && selectedRegion && !showDeleted && (
              <div className="current-filter">
                <span className="filter-label">현재 조회 중:</span>
                <span className="filter-value">{selectedRegion} 지부</span>
              </div>
          )}

          {/* 회원 테이블 */}
          <div className="table-container">
            {isLoading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>데이터를 불러오는 중...</p>
                </div>
            ) : members.length > 0 ? (
                <>
                  <MemberTable
                      members={members}
                      fetchMembers={() => fetchMembers(currentPage)}
                      isDeletedView={showDeleted}
                      userRole={userRole}
                      allowedRoles={userRole === "OWNER" ? ["PENDING", "USER", "COACH"] : ["PENDING", "USER", "COACH", "OWNER"]}
                  />
                  <div className="pagination-container">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                  </div>
                </>
            ) : isSearched ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <p className="empty-text">검색 결과가 없습니다</p>
                  <p className="empty-subtext">다른 검색 조건을 입력해 보세요</p>
                </div>
            ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <p className="empty-text">데이터를 불러오는 중입니다</p>
                  <p className="empty-subtext">잠시만 기다려주세요</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default MemberManagement;