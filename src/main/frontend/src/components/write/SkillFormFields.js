import React from 'react';

const SkillFormFields = ({ formData, onChange, disabled }) => {
  const positions = [
    { value: 'TOP', label: 'TOP' },
    { value: 'GUARD', label: 'GUARD' }
  ];

  const skillTypes = [
    { value: 'SUBMISSION', label: 'SUBMISSION' },
    { value: 'PASS', label: 'PASS' },
    { value: 'SWEEP', label: 'SWEEP' },
    { value: 'RECOVERY', label: 'RECOVERY' },
    { value: 'TAKEDOWN', label: 'TAKEDOWN' }
  ];

  return (
      <>
        <div className="form-group">
          <label htmlFor="position">포지션 *</label>
          <select
              id="position"
              name="position"
              value={formData.position || ''}
              onChange={onChange}
              disabled={disabled}
              required
              className="form-select"
          >
            <option value="">포지션을 선택해주세요</option>
            {positions.map(position => (
                <option key={position.value} value={position.value}>
                  {position.label}
                </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="skillType">기술 타입 *</label>
          <select
              id="skillType"
              name="skillType"
              value={formData.skillType || ''}
              onChange={onChange}
              disabled={disabled}
              required
              className="form-select"
          >
            <option value="">기술 타입을 선택해주세요</option>
            {skillTypes.map(skillType => (
                <option key={skillType.value} value={skillType.value}>
                  {skillType.label}
                </option>
            ))}
          </select>
        </div>
      </>
  );
};

export default SkillFormFields;