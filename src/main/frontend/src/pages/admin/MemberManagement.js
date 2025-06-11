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
            // OWNER인 경우 지부 정보 처리
            const branchIds = parsedInfo.branchIds || (parsedInfo.branchId ? [parsedInfo.branchId] : []);
            const branches = parsedInfo.branches || [];

            setUserBranchIds(branchIds);
            setUserBranches(branches);

            console.log("OWNER 지부 정보:", { branchIds, branches });

            // 🔥 단일 지부 관리자인 경우 자동으로 해당 지부 선택
            if (branches.length === 1) {
              setSelectedOwnerBranch(branches[0].id.toString());
              console.log("단일 지부 자동 선택:", branches[0].id);
            }

            // 모든 지부 정보도 로드
            fetchAllBranches();

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
              // 🔥 ADMIN 초기 로드시 전체 조회를 위해 fetchMembersWithRegion 사용
              fetchMembersWithRegion(""); // 빈 문자열로 전체 조회
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

    // 즉시 회원 조회 실행
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

    // 즉시 회원 조회 실행
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

      // 삭제된 회원 보기가 아닌 경우에만 검색 조건 추가
      if (!showDeleted) {
        // 이름 검색
        if (filters.name && filters.name.trim() !== "") {
          params.append("name", filters.name.trim());
        }

        // 역할 검색 (ADMIN만)
        if (filters.role && filters.role.trim() !== "") {
          params.append("role", filters.role.trim());
        }

        // 지부 검색 - region별 조회
        if (region && region !== "" && region !== "전체") {
          // 특정 region 선택된 경우 해당 region의 지부들 ID를 찾아서 전송
          const selectedBranches = allBranches.filter(branch => branch.region === region);
          console.log(`선택된 region "${region}"에 해당하는 지부들:`, selectedBranches);

          // 🔥 수정: 단일/다중 지부 모두 branchIds로 통일
          selectedBranches.forEach(branch => {
            params.append("branchIds", branch.id);
          });
        }
        // 🔥 region이 빈 문자열이거나 "전체"인 경우 지부 조건을 추가하지 않음 (전체 조회)
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

      // 삭제된 회원 보기가 아닌 경우에만 검색 조건 추가
      if (!showDeleted) {
        // 이름 검색
        if (filters.name && filters.name.trim() !== "") {
          params.append("name", filters.name.trim());
        }

        // 역할 검색 (OWNER는 activeTab 사용)
        params.append("role", activeTab);

        // 🔥 수정: branchId 대신 branchIds 사용
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
          // OWNER는 자신이 관리하는 지부의 회원 조회
          if (selectedOwnerBranch) {
            // 🔥 수정: branchId 대신 branchIds 사용
            params.append("branchIds", selectedOwnerBranch);
          } else {
            // 선택하지 않은 경우 - 단일 지부면 자동 선택, 다중 지부면 빈 결과
            if (userBranches.length === 1) {
              // 🔥 수정: branchId 대신 branchIds 사용
              params.append("branchIds", userBranches[0].id);
            } else if (userBranches.length > 1) {
              // 다중 지부 관리자가 지부를 선택하지 않은 경우 빈 결과
              params.append("branchIds", "-1");
            }
          }
        } else if (userRole === "ADMIN") {
          // ADMIN인 경우 선택된 region에 따른 조회
          if (selectedRegion && selectedRegion !== "" && selectedRegion !== "전체") {
            // 특정 region 선택된 경우
            const selectedBranches = allBranches.filter(branch => branch.region === selectedRegion);
            console.log(`선택된 region "${selectedRegion}"에 해당하는 지부들:`, selectedBranches);

            // 🔥 수정: 단일/다중 지부 모두 branchIds로 통일
            selectedBranches.forEach(branch => {
              params.append("branchIds", branch.id);
            });
          }
          // 🔥 selectedRegion이 빈 문자열이거나 "전체"인 경우 지부 조건을 추가하지 않음 (전체 조회)
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
        // ADMIN인 경우 현재 selectedRegion 상태에 따라 조회
        fetchMembersWithRegion(selectedRegion, 1);
      } else {
        // OWNER인 경우 기존 방식 사용
        fetchMembers(1);
      }
    }
  }, [showDeleted]);

  // 페이지 변경 시 데이터 로드
  useEffect(() => {
    if (isSearched) {
      if (userRole === "ADMIN") {
        // ADMIN인 경우 현재 selectedRegion 상태에 따라 조회
        fetchMembersWithRegion(selectedRegion, currentPage);
      } else {
        // OWNER인 경우 기존 방식 사용
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
      // ADMIN인 경우 현재 selectedRegion 상태에 따라 조회
      fetchMembersWithRegion(selectedRegion, 1);
    } else {
      // OWNER인 경우 기존 방식 사용
      fetchMembers(1);
    }
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

  // OWNER가 현재 선택한 지부 ID 계산
  const getCurrentUserBranchId = () => {
    if (userRole !== "OWNER") return null;

    // branchRoles에서 OWNER 역할의 지부 찾기
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const branchRoles = userInfo.branchRoles || [];
    const ownerBranch = branchRoles.find(br => br.role === "OWNER");

    if (ownerBranch) {
      return ownerBranch.branchId;
    }

    // 기존 로직 (하위 호환성)
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
                {/* 다중 지부 관리자인 경우 버튼 형태 (전체 버튼 없음) */}
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

          {/* OWNER 다중 지부 관리자의 현재 선택된 지부 표시 */}
          {userRole === "OWNER" && userBranches.length > 1 && selectedOwnerBranch && !showDeleted && (
              <div className="current-filter">
                <span className="filter-label">현재 조회 중:</span>
                <span className="filter-value">
                {getSelectedOwnerBranchInfo()?.region} {getSelectedOwnerBranchInfo()?.area} 지부
              </span>
              </div>
          )}

          {/* 회원 테이블 - 컴팩트 컨테이너 사용 */}
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