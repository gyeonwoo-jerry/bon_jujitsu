import React from 'react';

const MemberGradeSelect = ({ userId, currentGrade }) => {
  const handleChange = async (e) => {
    const newGrade = e.target.value;
    // TODO: API 호출로 등급 변경
    console.log(`Change grade for ${userId} to ${newGrade}`);
  };

  return (
      <select value={currentGrade} onChange={handleChange} className="border rounded px-2 py-1">
        <option value="PENDING">PENDING</option>
        <option value="USER">USER</option>
        <option value="COACH">COACH</option>
        <option value="OWNER">OWNER</option>
      </select>
  );
};

export default MemberGradeSelect;
