import React, { useState } from 'react';
import API from "../../utils/api";

// 회원 테이블 컴포넌트
const MemberTable = ({ members, fetchMembers, isDeletedView = false }) => {
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

  // 회원 등급 목록
  const roleOptions = ['PENDING', 'USER', 'COACH', 'OWNER'];

  // 회원별 선택된 역할과 수정 버튼 표시 상태 관리
  const [memberRoles, setMemberRoles] = useState({});

  // 로딩 상태
  const [loading, setLoading] = useState(false);

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
            className="status-badge"
            style={{
              backgroundColor: style.bg,
              color: style.text,
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.8rem',
            }}
        >
        {displayNames[role] || role}
      </span>
    );
  };

  // 등급 변경 핸들러
  const handleRoleChange = (memberId, newRole, currentRole) => {
    setMemberRoles({
      ...memberRoles,
      [memberId]: {
        role: newRole,
        showUpdateButton: newRole !== currentRole
      }
    });
  };

  // 등급 변경 제출 핸들러
  const handleRoleUpdate = (memberId, userId) => {
    if (!memberRoles[memberId]?.role) return;

    const confirmUpdate = window.confirm('회원 등급을 변경하시겠습니까?');
    if (!confirmUpdate) return;

    // 검색 화면에서 본 것처럼 지부 ID는 1로 고정
    const branchId = 1;

    // API 요청 데이터
    const requestData = {
      targetUserId: userId,
      branchId: branchId,
      role: memberRoles[memberId].role
    };

    console.log('등급 변경 요청 데이터:', requestData);

    setLoading(true);

    // API 직접 호출
    API.post('/admin/assignRole', requestData)
    .then(response => {
      console.log('API 응답:', response);
      if (response.data && response.data.success) {
        alert('등급이 성공적으로 변경되었습니다.');

        // 변경 후 목록 새로고침
        if (fetchMembers) fetchMembers();

        // 수정 버튼 숨기기
        setMemberRoles({
          ...memberRoles,
          [memberId]: {
            ...memberRoles[memberId],
            showUpdateButton: false
          }
        });
      } else {
        alert('등급 변경에 실패했습니다.');
      }
    })
    .catch(error => {
      console.error('등급 변경 중 오류 발생:', error);
      if (error.response && error.response.data) {
        alert(`등급 변경 실패: ${error.response.data.message || '서버 오류'}`);
      } else {
        alert('등급 변경에 실패했습니다. 다시 시도해주세요.');
      }
    })
    .finally(() => {
      setLoading(false);
    });
  };

  return (
      <table className="table table-hover">
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
          const currentRole = member.branchUsers && member.branchUsers.length > 0
              ? member.branchUsers[0].userRole
              : 'PENDING';

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
                  {member.branchUsers && member.branchUsers.length > 0
                      ? member.branchUsers[0].region
                      : '-'}
                </td>
                <td>
                  {!isDeletedView ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <select
                            className="form-select form-select-sm"
                            style={{ width: 'auto' }}
                            defaultValue={currentRole}
                            onChange={(e) => handleRoleChange(member.id, e.target.value, currentRole)}
                            disabled={loading}
                        >
                          {roleOptions.map(role => (
                              <option key={role} value={role}>
                                {role === 'OWNER' ? '지부장' :
                                    role === 'COACH' ? '코치' :
                                        role === 'USER' ? '회원' : '대기중'}
                              </option>
                          ))}
                        </select>

                        {memberRoles[member.id]?.showUpdateButton && (
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleRoleUpdate(member.id, member.id)}
                                disabled={loading}
                            >
                              {loading ? '처리중...' : '수정'}
                            </button>
                        )}
                      </div>
                  ) : (
                      getRoleBadge(currentRole)
                  )}
                </td>
                <td>{formatDate(member.createdAt)}</td>
                {!isDeletedView && (
                    <td>
                      {/* 필요한 추가 작업 버튼들 */}
                    </td>
                )}
              </tr>
          );
        })}
        </tbody>
      </table>
  );
};

export default MemberTable;