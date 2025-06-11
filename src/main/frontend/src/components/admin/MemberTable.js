import React, { useState, useEffect } from 'react';
import API from "../../utils/api";
import "../../styles/admin/admin.css";

// 회원 테이블 컴포넌트
const MemberTable = ({
                       members,
                       fetchMembers,
                       isDeletedView = false,
                       userRole,
                       allowedRoles = ["PENDING", "USER", "COACH", "OWNER"],
                       allBranches = [],
                       userBranchId = null // OWNER인 경우 자신의 지부 ID
                     }) => {
  // 날짜 포맷 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    } catch (e) {
      return dateString; // 파싱 실패 시 원본 반환
    }
  };

  // 회원별 선택된 역할 상태 관리
  const [selectedRoles, setSelectedRoles] = useState({});

  // 회원별 선택된 사용자 정보 상태 관리
  const [selectedUserInfo, setSelectedUserInfo] = useState({});

  // 회원별 선택된 브랜치 상태 관리
  const [selectedBranches, setSelectedBranches] = useState({});

  // 로딩 상태
  const [loading, setLoading] = useState({});

  // 스트라이프 옵션
  const stripeOptions = [
    { value: 'WHITE', label: '화이트' },
    { value: 'BLUE', label: '블루' },
    { value: 'PURPLE', label: '퍼플' },
    { value: 'BROWN', label: '브라운' },
    { value: 'BLACK', label: '블랙' }
  ];

  // OWNER인 경우 자신이 관리하는 지부에 속한 브랜치 사용자만 필터링
  const filterBranchUsersByOwnerRole = (branchUsers) => {
    if (userRole === "OWNER") {
      // localStorage에서 OWNER가 관리하는 모든 지부 ID 가져오기
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const branchRoles = userInfo.branchRoles || [];
      const ownerBranchIds = branchRoles
          .filter(br => br.role === "OWNER")
          .map(br => br.branchId);

      if (ownerBranchIds.length > 0) {
        return branchUsers.filter(bu => ownerBranchIds.includes(bu.branchId));
      }
    }
    return branchUsers;
  };

  // 회원이 OWNER가 관리하는 지부 중 하나라도 속해 있는지 확인
  const isMemberInOwnerBranches = (branchUsers) => {
    if (userRole !== "OWNER") return true;

    const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
    const branchRoles = userInfo.branchRoles || [];
    const ownerBranchIds = branchRoles
        .filter(br => br.role === "OWNER")
        .map(br => br.branchId);

    return branchUsers.some(bu => ownerBranchIds.includes(bu.branchId));
  };

  // OWNER인 경우 자신의 지부만 표시할 수 있는 브랜치 목록 필터링
  const getAvailableBranches = () => {
    if (userRole === "OWNER" && userBranchId) {
      return allBranches.filter(branch => branch.id === userBranchId);
    }
    return allBranches;
  };

  // 디버그 정보
  useEffect(() => {
    if (members && members.length > 0) {
      const firstMember = members[0];
      console.log('회원 데이터 구조 예시:', firstMember);

      if (firstMember.branchUsers && firstMember.branchUsers.length > 0) {
        console.log('branchUsers 구조:', firstMember.branchUsers[0]);
      }
    }
  }, [members]);

  // 회원 등급 표시
  const getRoleBadge = (role) => {
    if (!role) return null;

    const roleColors = {
      OWNER: { bg: '#d1fae5', text: '#065f46' },
      COACH: { bg: '#e0e7ff', text: '#4338ca' },
      USER: { bg: '#f3f4f6', text: '#4b5563' },
      PENDING: { bg: '#fef3c7', text: '#92400e' },
    };

    const displayNames = {
      OWNER: '지부장',
      COACH: '코치',
      USER: '회원',
      PENDING: '대기중',
    };

    const style = roleColors[role] || { bg: '#f3f4f6', text: '#4b5563' };

    return (
        <span
            className={`status-badge status-${role.toLowerCase()}`}
        >
        {displayNames[role] || role}
      </span>
    );
  };

  // 등급 변경 핸들러
  const handleRoleChange = (memberId, role) => {
    setSelectedRoles(prev => ({
      ...prev,
      [memberId]: role
    }));
  };

  // 사용자 정보 변경 핸들러
  const handleUserInfoChange = (memberId, field, value) => {
    setSelectedUserInfo(prev => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value
      }
    }));
  };

  // 브랜치 변경 핸들러
  const handleBranchChange = (memberId, branchId) => {
    setSelectedBranches(prev => ({
      ...prev,
      [memberId]: branchId
    }));
  };

  // 등급 변경 제출 핸들러
  const handleRoleUpdate = (memberId, userId, currentRole, branchUser) => {
    // 선택된 역할이 없으면 현재 역할 사용
    const newRole = selectedRoles[memberId] || currentRole;

    // 역할이 변경되지 않았으면 무시
    if (newRole === currentRole) {
      alert('변경된 등급이 없습니다.');
      return;
    }

    // 허용되지 않은 역할로의 변경 시도 차단
    if (!allowedRoles.includes(newRole)) {
      alert(`선택한 역할(${newRole})로 변경할 권한이 없습니다.`);
      return;
    }

    // branchUser에서 branchId 추출
    if (!branchUser || !branchUser.branchId) {
      alert('회원의 지부 정보를 찾을 수 없습니다. 지부가 있는 회원만 등급을 변경할 수 있습니다.');
      return;
    }

    const branchId = branchUser.branchId;
    console.log(`회원 ID: ${userId}, 지부 ID: ${branchId}, 새 역할: ${newRole}`);

    const confirmUpdate = window.confirm(`회원 등급을 ${newRole}으로 변경하시겠습니까?`);
    if (!confirmUpdate) return;

    // 로딩 상태 설정
    setLoading(prev => ({
      ...prev,
      [`role_${memberId}`]: true
    }));

    // API 요청 데이터
    const requestData = {
      targetUserId: Number(userId),
      branchId: Number(branchId),
      role: newRole
    };

    console.log('등급 변경 요청 데이터:', requestData);

    // API 직접 호출
    API.post('/admin/assignRole', requestData)
        .then(response => {
          console.log('API 응답:', response);
          if (response.data && response.data.success) {
            alert('회원 등급이 성공적으로 변경되었습니다.');

            // 목록 새로고침
            if (fetchMembers) {
              fetchMembers();
            }
          } else {
            alert('회원 등급 변경에 실패했습니다.');
          }
        })
        .catch(error => {
          console.error('등급 변경 중 오류 발생:', error);

          // 상세 오류 정보 표시
          if (error.response && error.response.data) {
            const errorMessage = error.response.data.message || '서버 오류';
            alert(`등급 변경 실패: ${errorMessage}`);
          } else {
            alert('등급 변경에 실패했습니다. 다시 시도해주세요.');
          }
        })
        .finally(() => {
          // 로딩 상태 해제
          setLoading(prev => ({
            ...prev,
            [`role_${memberId}`]: false
          }));
        });
  };

  // 사용자 정보 업데이트 핸들러
  const handleUserInfoUpdate = (memberId, userId, currentLevel, currentStripe) => {
    const memberInfo = selectedUserInfo[memberId] || {};
    const newLevel = memberInfo.level !== undefined ? memberInfo.level : currentLevel;
    const newStripe = memberInfo.stripe !== undefined ? memberInfo.stripe : currentStripe;

    // 변경사항이 없으면 무시
    if (newLevel === currentLevel && newStripe === currentStripe) {
      alert('변경된 정보가 없습니다.');
      return;
    }

    const confirmUpdate = window.confirm('회원 정보를 변경하시겠습니까?');
    if (!confirmUpdate) return;

    // 로딩 상태 설정
    setLoading(prev => ({
      ...prev,
      [`info_${memberId}`]: true
    }));

    // API 요청 데이터
    const requestData = {
      targetUserId: Number(userId),
      level: newLevel,
      stripe: newStripe
    };

    console.log('사용자 정보 변경 요청 데이터:', requestData);

    // API 호출
    API.patch('/admin/users/info', requestData)
        .then(response => {
          console.log('API 응답:', response);
          if (response.data && response.data.success) {
            alert('회원 정보가 성공적으로 변경되었습니다.');

            // 선택된 정보 초기화
            setSelectedUserInfo(prev => ({
              ...prev,
              [memberId]: {}
            }));

            // 목록 새로고침
            if (fetchMembers) {
              fetchMembers();
            }
          } else {
            alert('회원 정보 변경에 실패했습니다.');
          }
        })
        .catch(error => {
          console.error('사용자 정보 변경 중 오류 발생:', error);

          if (error.response && error.response.data) {
            const errorMessage = error.response.data.message || '서버 오류';
            alert(`정보 변경 실패: ${errorMessage}`);
          } else {
            alert('정보 변경에 실패했습니다. 다시 시도해주세요.');
          }
        })
        .finally(() => {
          setLoading(prev => ({
            ...prev,
            [`info_${memberId}`]: false
          }));
        });
  };

  // 브랜치 추가 핸들러
  const handleBranchAdd = (memberId, userId) => {
    const newBranchId = selectedBranches[memberId];

    if (!newBranchId) {
      alert('추가할 지부를 선택해주세요.');
      return;
    }

    const availableBranches = getAvailableBranches();
    const selectedBranch = availableBranches.find(branch => branch.id === parseInt(newBranchId));
    const confirmAdd = window.confirm(`${selectedBranch?.region || '선택한 지부'}에 추가하시겠습니까?`);
    if (!confirmAdd) return;

    // 로딩 상태 설정
    setLoading(prev => ({
      ...prev,
      [`branch_${memberId}`]: true
    }));

    const requestData = {
      targetUserId: Number(userId),
      branchesToAdd: [parseInt(newBranchId)],
      branchesToRemove: []
    };

    console.log('브랜치 추가 요청 데이터:', requestData);

    API.patch('/admin/users/branches', requestData)
        .then(response => {
          console.log('API 응답:', response);
          if (response.data && response.data.success) {
            alert('지부가 성공적으로 추가되었습니다.\n새 지부에서는 "대기중" 상태로 추가되며, 필요시 역할을 변경해주세요.');

            // 선택된 브랜치 초기화
            setSelectedBranches(prev => ({
              ...prev,
              [memberId]: ''
            }));

            // 목록 새로고침
            if (fetchMembers) {
              fetchMembers();
            }
          } else {
            alert('지부 추가에 실패했습니다.');
          }
        })
        .catch(error => {
          console.error('지부 추가 중 오류 발생:', error);

          if (error.response && error.response.data) {
            const errorMessage = error.response.data.message || '서버 오류';
            alert(`지부 추가 실패: ${errorMessage}`);
          } else {
            alert('지부 추가에 실패했습니다. 다시 시도해주세요.');
          }
        })
        .finally(() => {
          setLoading(prev => ({
            ...prev,
            [`branch_${memberId}`]: false
          }));
        });
  };

  // 브랜치 제거 핸들러
  const handleBranchRemove = (memberId, userId, branchId, branchName) => {
    const confirmRemove = window.confirm(`${branchName}에서 제거하시겠습니까?`);
    if (!confirmRemove) return;

    // 로딩 상태 설정
    setLoading(prev => ({
      ...prev,
      [`branch_${memberId}`]: true
    }));

    const requestData = {
      targetUserId: Number(userId),
      branchesToAdd: [],
      branchesToRemove: [branchId]
    };

    console.log('브랜치 제거 요청 데이터:', requestData);

    API.patch('/admin/users/branches', requestData)
        .then(response => {
          console.log('API 응답:', response);
          if (response.data && response.data.success) {
            alert('지부에서 성공적으로 제거되었습니다.');

            // 목록 새로고침
            if (fetchMembers) {
              fetchMembers();
            }
          } else {
            alert('지부 제거에 실패했습니다.');
          }
        })
        .catch(error => {
          console.error('지부 제거 중 오류 발생:', error);

          if (error.response && error.response.data) {
            const errorMessage = error.response.data.message || '서버 오류';
            alert(`지부 제거 실패: ${errorMessage}`);
          } else {
            alert('지부 제거에 실패했습니다. 다시 시도해주세요.');
          }
        })
        .finally(() => {
          setLoading(prev => ({
            ...prev,
            [`branch_${memberId}`]: false
          }));
        });
  };

  return (
      <table className="member-table">
        <thead>
        <tr>
          <th>ID</th>
          <th>이름</th>
          <th>아이디</th>
          <th>이메일</th>
          <th>연락처</th>
          <th>띠/그랄</th>
          <th>소속 지부</th>
          <th>회원 등급</th>
          <th>가입일</th>
        </tr>
        </thead>
        <tbody>
        {members.map((member) => {
          // OWNER인 경우: 이 회원이 자신이 관리하는 지부 중 하나라도 속해 있는지 확인
          if (!isMemberInOwnerBranches(member.branchUsers || [])) {
            return null; // 자신이 관리하는 지부에 속하지 않은 회원은 표시 안함
          }

          // OWNER인 경우 자신의 지부에 속한 브랜치 사용자만 필터링
          const filteredBranchUsers = filterBranchUsersByOwnerRole(member.branchUsers || []);

          // 디버깅용 로그 추가
          if (userRole === "OWNER") {
            console.log(`회원 ${member.name} (ID: ${member.id}):`, {
              original: member.branchUsers,
              filtered: filteredBranchUsers,
              userBranchId: userBranchId
            });
          }

          // branchUsers에서 첫 번째 항목 가져오기 (필터링된 결과에서)
          const branchUser = filteredBranchUsers.length > 0 ? filteredBranchUsers[0] : null;
          const currentRole = branchUser ? branchUser.userRole : 'PENDING';

          // 관장님은 다른 관장님의 등급을 변경할 수 없음
          const canEditRole = !(userRole === "OWNER" && currentRole === "OWNER");

          // 로딩 상태들
          const isRoleUpdating = loading[`role_${member.id}`] || false;
          const isInfoUpdating = loading[`info_${member.id}`] || false;
          const isBranchUpdating = loading[`branch_${member.id}`] || false;

          // 현재 사용자 정보
          const memberInfo = selectedUserInfo[member.id] || {};
          const currentLevel = memberInfo.level !== undefined ? memberInfo.level : member.level;
          const currentStripe = memberInfo.stripe !== undefined ? memberInfo.stripe : member.stripe;

          // 사용 가능한 브랜치 목록
          const availableBranches = getAvailableBranches();

          return (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.memberId}</td>
                <td>{member.email}</td>
                <td>{member.phoneNum}</td>
                <td>
                  {!isDeletedView ? (
                      <div className="info-controls">
                        <div className="info-row">
                          <select
                              className="info-select stripe-select"
                              value={currentStripe || ''}
                              onChange={(e) => handleUserInfoChange(member.id, 'stripe', e.target.value)}
                              disabled={isInfoUpdating}
                          >
                            <option value="">띠 선택</option>
                            {stripeOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                            ))}
                          </select>
                          <input
                              type="number"
                              className="info-input level-input"
                              placeholder="그랄"
                              min="0"
                              max="10"
                              value={currentLevel || ''}
                              onChange={(e) => handleUserInfoChange(member.id, 'level', parseInt(e.target.value) || 0)}
                              disabled={isInfoUpdating}
                          />
                        </div>
                        <button
                            className={`update-button info-update-button ${isInfoUpdating ? 'updating' : ''}`}
                            onClick={() => handleUserInfoUpdate(member.id, member.id, member.level, member.stripe)}
                            disabled={isInfoUpdating}
                        >
                          {isInfoUpdating ? '처리중...' : '수정'}
                        </button>
                      </div>
                  ) : (
                      <span>
                      {member.stripe && `${member.stripe} `}
                        {member.stripe && member.level && ' / '}
                        {member.level && `grau.${member.level}`}
                    </span>
                  )}
                </td>
                <td>
                  {!isDeletedView && userRole === "ADMIN" ? (
                      <div className="branch-controls">
                        <div className="current-branches">
                          {filteredBranchUsers.length > 0 ? (
                              filteredBranchUsers.map((branchUser, index) => (
                                  <div key={branchUser.branchId} className="branch-item">
                                    <span className="branch-name">{branchUser.region}</span>
                                    <button
                                        className="remove-branch-button"
                                        onClick={() => handleBranchRemove(member.id, member.id, branchUser.branchId, branchUser.region)}
                                        disabled={isBranchUpdating}
                                        title="이 지부에서 제거"
                                    >
                                      ×
                                    </button>
                                  </div>
                              ))
                          ) : (
                              <span className="no-branch">소속 지부 없음</span>
                          )}
                        </div>
                        <div className="add-branch-section">
                          <select
                              className="branch-select"
                              value={selectedBranches[member.id] || ''}
                              onChange={(e) => handleBranchChange(member.id, e.target.value)}
                              disabled={isBranchUpdating}
                          >
                            <option value="">지부 추가</option>
                            {availableBranches
                                .filter(branch => !filteredBranchUsers.some(bu => bu.branchId === branch.id))
                                .map(branch => (
                                    <option key={branch.id} value={branch.id}>
                                      {branch.region} ({branch.area})
                                    </option>
                                ))}
                          </select>
                          <button
                              className={`update-button branch-add-button ${isBranchUpdating ? 'updating' : ''}`}
                              onClick={() => handleBranchAdd(member.id, member.id)}
                              disabled={isBranchUpdating || !selectedBranches[member.id]}
                          >
                            {isBranchUpdating ? '처리중...' : '추가'}
                          </button>
                        </div>
                      </div>
                  ) : (
                      <div>
                        {filteredBranchUsers.length > 0
                            ? filteredBranchUsers.map(bu => bu.region).join(', ')
                            : '-'
                        }
                      </div>
                  )}
                </td>
                <td>
                  {!isDeletedView ? (
                      <div className="roles-section">
                        {filteredBranchUsers.length > 0 ? (
                            filteredBranchUsers.map((branchUser, index) => {
                              const currentRole = branchUser.userRole;
                              const canEditRole = !(userRole === "OWNER" && currentRole === "OWNER");
                              const isRoleUpdating = loading[`role_${member.id}_${branchUser.branchId}`] || false;

                              return (
                                  <div key={branchUser.branchId} className="role-item">
                                    <span className="role-branch-label">{branchUser.region}:</span>
                                    <div className="role-controls">
                                      {canEditRole && branchUser ? (
                                          <>
                                            <select
                                                className="role-select"
                                                value={selectedRoles[`${member.id}_${branchUser.branchId}`] || currentRole}
                                                onChange={(e) => handleRoleChange(`${member.id}_${branchUser.branchId}`, e.target.value)}
                                                disabled={isRoleUpdating}
                                            >
                                              {allowedRoles.map(role => (
                                                  <option key={role} value={role}>
                                                    {role === 'OWNER' ? '지부장' :
                                                        role === 'COACH' ? '코치' :
                                                            role === 'USER' ? '회원' : '대기중'}
                                                  </option>
                                              ))}
                                            </select>
                                            <button
                                                className={`update-button role-update-button ${isRoleUpdating ? 'updating' : ''}`}
                                                onClick={() => handleRoleUpdate(`${member.id}_${branchUser.branchId}`, member.id, currentRole, branchUser)}
                                                disabled={isRoleUpdating}
                                            >
                                              {isRoleUpdating ? '처리중...' : '수정'}
                                            </button>
                                          </>
                                      ) : (
                                          getRoleBadge(currentRole)
                                      )}
                                    </div>
                                  </div>
                              );
                            })
                        ) : (
                            <span className="no-role">역할 없음</span>
                        )}
                      </div>
                  ) : (
                      <div>
                        {filteredBranchUsers.length > 0
                            ? filteredBranchUsers.map(bu => `${bu.region}: ${getRoleBadge(bu.userRole)?.props?.children || bu.userRole}`).join(', ')
                            : '-'
                        }
                      </div>
                  )}
                </td>
                <td>{formatDate(member.createdAt)}</td>
              </tr>
          );
        })}
        </tbody>
      </table>
  );
};

export default MemberTable;