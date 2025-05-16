import React, { useState, useEffect } from 'react';
import API from "../../utils/api";
import '../../styles/admin/memberTable.css';

// 회원 테이블 컴포넌트
const MemberTable = ({ members, fetchMembers, isDeletedView = false, userRole, allowedRoles = ["PENDING", "USER", "COACH", "OWNER"] }) => {
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

  // 로딩 상태
  const [loading, setLoading] = useState({});

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
      [memberId]: true
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
        [memberId]: false
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
          <th>레벨/띠</th>
          <th>소속 지부</th>
          <th>회원 등급</th>
          <th>가입일</th>
        </tr>
        </thead>
        <tbody>
        {members.map((member) => {
          // branchUsers에서 첫 번째 항목 가져오기
          const branchUser = member.branchUsers && member.branchUsers.length > 0
              ? member.branchUsers[0]
              : null;

          const currentRole = branchUser ? branchUser.userRole : 'PENDING';

          // 관장님은 다른 관장님의 등급을 변경할 수 없음
          const canEditRole = !(userRole === "OWNER" && currentRole === "OWNER");

          // 이 회원에 대한 로딩 상태
          const isUpdating = loading[member.id] || false;

          return (
              <tr key={member.id}>
                <td>{member.id}</td>
                <td>{member.name}</td>
                <td>{member.memberId}</td>
                <td>{member.email}</td>
                <td>{member.phoneNum}</td>
                <td>
                  {member.level && `Lv.${member.level}`}
                  {member.level && member.stripe && ' / '}
                  {member.stripe}
                </td>
                <td>
                  {branchUser ? branchUser.region : '-'}
                </td>
                <td>
                  {!isDeletedView ? (
                      <div className="role-controls">
                        {canEditRole && branchUser ? (
                            <>
                              <select
                                  className="role-select"
                                  value={selectedRoles[member.id] || currentRole}
                                  onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                  disabled={isUpdating}
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
                                  className={`update-button ${isUpdating ? 'updating' : ''}`}
                                  onClick={() => handleRoleUpdate(member.id, member.id, currentRole, branchUser)}
                                  disabled={isUpdating || !branchUser}
                                  title={!branchUser ? '지부 정보가 없는 회원입니다' : ''}
                              >
                                {isUpdating ? '처리중...' : '수정'}
                              </button>
                            </>
                        ) : (
                            // 관장님은 다른 관장님의 등급을 변경할 수 없음 - 읽기 전용 표시
                            getRoleBadge(currentRole)
                        )}
                      </div>
                  ) : (
                      getRoleBadge(currentRole)
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