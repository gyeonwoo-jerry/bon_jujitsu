import React, { useState, useEffect } from "react";
import MemberTable from "../../components/admin/MemberTable";
import Pagination from "../../components/admin/Pagination";
import API from "../../utils/api";
import "../../styles/admin/memberManage.css"; // CSS 파일 import

const MemberManagePage = () => {
  const [members, setMembers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 검색 조건 상태
  const [filters, setFilters] = useState({
    name: "",
    role: "",
    branchId: "",
  });

  const handleChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const fetchMembers = async (page = 1) => {
    try {
      setIsLoading(true);
      const endpoint = showDeleted
          ? "/admin/users/deleted"
          : "/admin/users";

      // 서버가 1부터 시작하는 페이지 번호를 요구함
      const params = new URLSearchParams({
        page: page, // 페이지 번호를 0이 아닌 그대로 전달 (1부터 시작)
        size: 10,
      });

      // 조건이 있는 경우에만 파라미터 추가
      if (filters.name && filters.name.trim() !== "") params.append("name", filters.name.trim());
      if (filters.role && filters.role.trim() !== "") params.append("role", filters.role.trim());
      // branchId가 있을 경우에만 추가하고, 숫자형으로 변환하여 추가
      if (filters.branchId && filters.branchId.trim() !== "") {
        const branchIdNumber = parseInt(filters.branchId.trim(), 10);
        if (!isNaN(branchIdNumber)) {
          params.append("branchId", branchIdNumber);
        }
      }

      console.log(`API 요청 URL: ${endpoint}?${params.toString()}`); // 디버깅용 로그

      const res = await API.get(`${endpoint}?${params.toString()}`);
      console.log("API 응답 데이터:", res.data); // 디버깅용 로그

      // 응답 구조에 맞게 데이터 파싱
      if (res.data && res.data.success && res.data.content) {
        // 응답 구조: { success: true, message: "...", content: { list: [...], page: 1, size: 10, totalPage: 1 } }
        const { list, totalPage, page: currentPageFromServer } = res.data.content;

        setMembers(list || []);
        setTotalPages(totalPage || 0);
        // 서버에서 반환된 현재 페이지로 UI 페이지 상태 업데이트
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
    } finally {
      setIsLoading(false);
    }
  };

  // 페이지 변경 시 검색 반복
  useEffect(() => {
    if (isSearched) {
      fetchMembers(currentPage);
    }
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchMembers(1);
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      role: "",
      branchId: "",
    });
  };

  // 회원 등급 변경 처리 함수
  const handleRoleUpdate = async (userId, branchId, newRole) => {
    try {
      setIsLoading(true);
      const response = await API.post('/admin/assignRole', {
        userId: userId,
        branchId: branchId,
        role: newRole
      });

      if (response.data && response.data.success) {
        alert('회원 등급이 성공적으로 변경되었습니다.');
        // 목록 새로고침
        fetchMembers(currentPage);
      } else {
        alert('회원 등급 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('등급 변경 중 오류 발생:', error);
      alert('등급 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="member-manage-container">
        <div className="member-manage-wrapper">
          {/* 헤더 섹션 */}
          <div className="page-header">
            <h1 className="page-title">회원관리</h1>
            <button
                onClick={() => {
                  setShowDeleted(!showDeleted);
                  setCurrentPage(1);
                  setIsSearched(false);
                  setMembers([]);
                }}
                className={`btn-toggle ${showDeleted ? 'active' : 'inactive'}`}
            >
            <span className="btn-icon">
              {showDeleted ? '👥' : '🗑️'}
            </span>
              {showDeleted ? "회원리스트 보기" : "삭제된 회원 보기"}
            </button>
          </div>

          {/* 검색 영역 - 삭제된 회원 보기 상태에서는 검색폼 숨김 */}
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

                  <div className="form-group">
                    <label className="form-label">지부 ID</label>
                    <input
                        name="branchId"
                        type="number"
                        placeholder="지부 번호 입력"
                        value={filters.branchId}
                        onChange={handleChange}
                        className="form-input"
                    />
                  </div>
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
                      onRoleUpdate={handleRoleUpdate}
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
                  <p className="empty-text">검색 조건을 입력하세요</p>
                  <p className="empty-subtext">회원 정보를 조회하려면 검색 버튼을 눌러주세요</p>
                </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default MemberManagePage;