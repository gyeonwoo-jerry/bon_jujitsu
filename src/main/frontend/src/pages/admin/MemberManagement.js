import React, { useState, useEffect } from "react";
import MemberTable from "../../components/admin/MemberTable";
import Pagination from "../../components/admin/Pagination";
import AdminHeader from "../../components/admin/AdminHeader";
import API from "../../utils/api";
import "../../styles/admin/admin.css";

const MemberManagement = () => {
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  // OWNER용 지부 관리
  const [userBranchIds, setUserBranchIds] = useState([]);
  const [userBranches, setUserBranches] = useState([]);
  const [selectedOwnerBranch, setSelectedOwnerBranch] = useState("");

  // ADMIN용 지부 region 목록
  const [regions, setRegions] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [regionsLoading, setRegionsLoading] = useState(false);

  // OWNER용 활성 탭 상태
  const [activeTab, setActiveTab] = useState("PENDING");

  // 검색 조건 상태 - Stripe 필터 추가
  const [filters, setFilters] = useState({
    name: "",
    role: "",
    stripe: ""  // Stripe 필터 추가
  });

  // Stripe 옵션
  const stripeOptions = [
    { value: "", label: "전체 띠" },
    { value: "WHITE", label: "화이트 벨트" },
    { value: "BLUE", label: "블루 벨트" },
    { value: "PURPLE", label: "퍼플 벨트" },
    { value: "BROWN", label: "브라운 벨트" },
    { value: "BLACK", label: "블랙 벨트" }
  ];

  // 지부 목록을 가져와서 고유한 region 추출 (ADMIN 권한일 때만)
  const fetchRegions = async () => {
    setRegionsLoading(true);
    try {
      const res = await API.get("/branch/all?page=1&size=1000");
      if (res.data?.success) {
        const branches = res.data.content?.list || [];
        setAllBranches(branches);

        const uniqueRegions = [...new Set(branches.map(branch => branch.region))];
        setRegions(uniqueRegions.sort());
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

  // 모든 지부 정보 가져오기 (OWNER도 사용)
  const fetchAllBranches = async () => {
    try {
      const res = await API.get("/branch/all?page=1&size=1000");
      if (res.data?.success) {
        const branches = res.data.content?.list || [];
        setAllBranches(branches);
        console.log("모든 지부 정보 로드:", branches);
      }
    } catch (err) {
      console.error("전체 지부 정보 조회 오류:", err);
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
            const branchIds = parsedInfo.branchIds || (parsedInfo.branchId ? [parsedInfo.branchId] : []);
            const branches = parsedInfo.branches || [];

            setUserBranchIds(branchIds);
            setUserBranches(branches);

            console.log("OWNER 지부 정보:", { branchIds, branches });

            if (branches.length === 1) {
              setSelectedOwnerBranch(branches[0].id.toString());
              console.log("단일 지부 자동 선택:", branches[0].id);
            }

            fetchAllBranches();

            setTimeout(() => {
              setIsSearched(true);
              fetchMembers(1);
            }, 200);
          } else if (role === "ADMIN") {
            setTimeout(() => {
              fetchRegions();
              setIsSearched(true);
              fetchMembersWithRegion("");
            }, 200);
          }
        }
      } catch (error) {
        console.error("사용자 정보 로드 오류:", error);
      }
    };

    loadUserInfo();
  }, []);

  // region 선택 핸들러 (ADMIN용) - 버튼 클릭 시 즉시 조회
  const handleRegionClick = (region) => {
    setSelectedRegion(region);
    setCurrentPage(1);

    setTimeout(() => {
      fetchMembersWithRegion(region);
    }, 100);
  };

  // OWNER 지부 선택 핸들러 (드롭다운용 - 단일 지부일 때만 사용)
  const handleOwnerBranchChange = (e) => {
    setSelectedOwnerBranch(e.target.value);
    setCurrentPage(1);
  };

  // OWNER 지부 선택 핸들러 (버튼 클릭용 - 다중 지부일 때 사용)
  const handleOwnerBranchClick = (branchId) => {
    setSelectedOwnerBranch(branchId);
    setCurrentPage(1);

    setTimeout(() => {
      fetchMembersWithBranch(branchId);
    }, 100);
  };

  // 검색 조건 변경 핸들러
  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // 특정 region으로 회원 데이터 가져오기 (ADMIN 버튼 클릭용)
  const fetchMembersWithRegion = async (region, page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = showDeleted ? "/admin/users/deleted" : "/admin/users";

      const params = new URLSearchParams({
        page: page,
        size: 10,
      });

      if (!showDeleted) {
        // 이름 검색
        if (filters.name && filters.name.trim() !== "") {
          params.append("name", filters.name.trim());
        }

        // 역할 검색 (ADMIN만)
        if (filters.role && filters.role.trim() !== "") {
          params.append("role", filters.role.trim());
        }

        // 🔥 Stripe 검색 추가
        if (filters.stripe && filters.stripe.trim() !== "") {
          params.append("stripe", filters.stripe.trim());
        }

        // 지부 검색 - region별 조회
        if (region && region !== "" && region !== "전체") {
          const selectedBranches = allBranches.filter(branch => branch.region === region);
          console.log(`선택된 region "${region}"에 해당하는 지부들:`, selectedBranches);

          selectedBranches.forEach(branch => {
            params.append("branchIds", branch.id);
          });
        }
        console.log("전체 조회 - 지부 조건 없이 API 호출");
      }

      console.log(`API 요청 URL: ${endpoint}?${params.toString()}`);
      console.log("전송될 파라미터:", Object.fromEntries(params.entries()));

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

  // 특정 지부로 회원 데이터 가져오기 (OWNER 버튼 클릭용)
  const fetchMembersWithBranch = async (branchId, page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = showDeleted ? "/admin/users/deleted" : "/admin/users";

      const params = new URLSearchParams({
        page: page,
        size: 10,
      });

      if (!showDeleted) {
        // 이름 검색
        if (filters.name && filters.name.trim() !== "") {
          params.append("name", filters.name.trim());
        }

        // 역할 검색 (OWNER는 activeTab 사용)
        params.append("role", activeTab);

        // 🔥 Stripe 검색 추가
        if (filters.stripe && filters.stripe.trim() !== "") {
          params.append("stripe", filters.stripe.trim());
        }

        if (branchId) {
          params.append("branchIds", branchId);
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

  // 회원 데이터 가져오기 (기존 함수 - 검색 버튼용)
  const fetchMembers = async (page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = showDeleted ? "/admin/users/deleted" : "/admin/users";

      const params = new URLSearchParams({
        page: page,
        size: 10,
      });

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

        // 🔥 Stripe 검색 추가
        if (filters.stripe && filters.stripe.trim() !== "") {
          params.append("stripe", filters.stripe.trim());
        }

        // 지부 검색
        if (userRole === "OWNER") {
          if (selectedOwnerBranch) {
            params.append("branchIds", selectedOwnerBranch);
          } else {
            if (userBranches.length === 1) {
              params.append("branchIds", userBranches[0].id);
            } else if (userBranches.length > 1) {
              params.append("branchIds", "-1");
            }
          }
        } else if (userRole === "ADMIN") {
          if (selectedRegion && selectedRegion !== "" && selectedRegion !== "전체") {
            const selectedBranches = allBranches.filter(branch => branch.region === selectedRegion);
            console.log(`선택된 region "${selectedRegion}"에 해당하는 지부들:`, selectedBranches);

            selectedBranches.forEach(branch => {
              params.append("branchIds", branch.id);
            });
          }
          console.log("ADMIN 전체 조회 또는 특정 region 조회, selectedRegion:", selectedRegion);
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
      if (userRole === "ADMIN") {
        fetchMembersWithRegion(selectedRegion, 1);
      } else {
        fetchMembers(1);
      }
    }
  }, [showDeleted]);

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    if (isSearched) {
      if (userRole === "ADMIN") {
        fetchMembersWithRegion(selectedRegion, currentPage);
      } else {
        fetchMembers(currentPage);
      }
    }
  }, [currentPage]);

  // OWNER 탭 변경 시 데이터 로드
  useEffect(() => {
    if (userRole === "OWNER" && isSearched) {
      setCurrentPage(1);
      fetchMembers(1);
    }
  }, [activeTab]);

  // 검색 버튼 핸들러
  const handleSearch = () => {
    setCurrentPage(1);
    if (userRole === "ADMIN") {
      fetchMembersWithRegion(selectedRegion, 1);
    } else {
      fetchMembers(1);
    }
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({
      name: "",
      role: "",
      stripe: ""  // Stripe 필터도 초기화
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

  // OWNER가 현재 선택한 지부 ID 계산
  const getCurrentUserBranchId = () => {
    if (userRole !== "OWNER") return null;

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const branchRoles = userInfo.branchRoles || [];
    const ownerBranch = branchRoles.find(br => br.role === "OWNER");

    if (ownerBranch) {
      return ownerBranch.branchId;
    }

    if (userBranches.length === 1) {
      return userBranches[0].id;
    } else if (userBranches.length > 1) {
      if (selectedOwnerBranch) {
        return parseInt(selectedOwnerBranch);
      } else {
        return userBranches[0].id;
      }
    }

    return null;
  };

  // OWNER의 지부 정보를 버튼으로 표시할지 결정하는 함수
  const getSelectedOwnerBranchInfo = () => {
    if (!selectedOwnerBranch || userBranches.length === 0) return null;
    return userBranches.find(branch => branch.id.toString() === selectedOwnerBranch);
  };

  return (
      <div className="admin_main">
        <AdminHeader />

        <div className="admin_contents">
          {/* 헤더 섹션 */}
          <div className="page-header">
            <div className="title">회원관리</div>
            <button
                onClick={() => {
                  setShowDeleted(!showDeleted);
                  setCurrentPage(1);
                }}
                className={`del_mb_list_btn btn-toggle ${showDeleted ? 'active' : 'inactive'}`}
            >
            <span className="btn-icon">
              {showDeleted ? '👥' : '🗑️'}
            </span>
              {showDeleted ? "회원리스트 보기" : "삭제된 회원 보기"}
            </button>
          </div>

          {/* ADMIN인 경우 지부 region 탭들 표시 */}
          {userRole === "ADMIN" && !showDeleted && (
              <div className="region_tabs">
                <div className="region_tabs_header">
                  <span className="region-tabs-label">▶ 지부별 조회</span>
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

          {/* OWNER인 경우 지부 선택 */}
          {userRole === "OWNER" && !showDeleted && (
              <>
                {/* 다중 지부 관리자인 경우 버튼 형태 */}
                {userBranches.length > 1 && (
                    <div className="region_tabs">
                      <div className="region_tabs_header">
                        <span className="region-tabs-label">관리 지부 선택</span>
                      </div>
                      <div className="region-buttons">
                        {userBranches.map((branch) => (
                            <button
                                key={branch.id}
                                className={`region-button ${selectedOwnerBranch === branch.id.toString() ? 'active' : ''}`}
                                onClick={() => handleOwnerBranchClick(branch.id.toString())}
                            >
                              {branch.region} {branch.area}
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                {/* 단일 지부 관리자인 경우 간단한 정보 표시 */}
                {userBranches.length === 1 && (
                    <div className="single-branch-info">
                      <span className="branch-info-label">관리 지부:</span>
                      <span className="branch-info-value">
                        {userBranches[0].region} {userBranches[0].area}
                      </span>
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

          {/* 검색 영역 - Stripe 필터 추가 */}
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

                  {/* 🔥 Stripe 필터 추가 */}
                  <div className="form-group">
                    <label className="form-label">띠 등급</label>
                    <select
                        name="stripe"
                        value={filters.stripe}
                        onChange={handleChange}
                        className="form-select"
                    >
                      {stripeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                      ))}
                    </select>
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

          {/* 현재 선택된 조건 표시 - Stripe 조건 추가 */}
          {!showDeleted && (
              <div className="current-filters">
                {userRole === "ADMIN" && selectedRegion && (
                    <div className="current-filter">
                      <span className="filter-label">지부:</span>
                      <span className="filter-value">{selectedRegion}</span>
                    </div>
                )}

                {userRole === "OWNER" && userBranches.length > 1 && selectedOwnerBranch && (
                    <div className="current-filter">
                      <span className="filter-label">지부:</span>
                      <span className="filter-value">
                        {getSelectedOwnerBranchInfo()?.region} {getSelectedOwnerBranchInfo()?.area}
                      </span>
                    </div>
                )}

                {/* 🔥 Stripe 필터 표시 */}
                {filters.stripe && (
                    <div className="current-filter">
                      <span className="filter-label">띠 등급:</span>
                      <span className="filter-value">
                        {stripeOptions.find(option => option.value === filters.stripe)?.label}
                      </span>
                    </div>
                )}

                {filters.name && (
                    <div className="current-filter">
                      <span className="filter-label">이름:</span>
                      <span className="filter-value">{filters.name}</span>
                    </div>
                )}

                {userRole === "ADMIN" && filters.role && (
                    <div className="current-filter">
                      <span className="filter-label">회원 등급:</span>
                      <span className="filter-value">
                        {filters.role === "PENDING" ? "대기중" :
                            filters.role === "USER" ? "일반 회원" :
                                filters.role === "COACH" ? "코치" :
                                    filters.role === "OWNER" ? "지부장" : filters.role}
                      </span>
                    </div>
                )}
              </div>
          )}

          {/* 회원 테이블 */}
          <div className="table-container-compact">
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
                      allBranches={allBranches}
                      userBranchId={getCurrentUserBranchId()}
                  />
                  <div className="pagination-container-wrapper">
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