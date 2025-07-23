import React from 'react';

const SkillFilterSection = ({
  selectedPosition,
  selectedSkillType,
  onPositionChange,
  onSkillTypeChange,
  onClearFilters,
  totalElements,
  isFiltered
}) => {
  const positions = [
    { value: '', label: '전체 포지션' },
    { value: 'TOP', label: 'TOP' },
    { value: 'GUARD', label: 'GUARD' }
  ];

  const skillTypes = [
    { value: '', label: '전체 기술' },
    { value: 'SUBMISSION', label: 'SUBMISSION' },
    { value: 'PASS', label: 'PASS' },
    { value: 'SWEEP', label: 'SWEEP' },
    { value: 'RECOVERY', label: 'RECOVERY' },
    { value: 'TAKEDOWN', label: 'TAKEDOWN' }
  ];

  return (
      <div className="skill-filter-section">
        <div className="filter-controls">
          <div className="filter-group">
            <label htmlFor="position-filter">포지션:</label>
            <select
                id="position-filter"
                value={selectedPosition}
                onChange={(e) => onPositionChange(e.target.value)}
                className="filter-select"
            >
              {positions.map(position => (
                  <option key={position.value} value={position.value}>
                    {position.label}
                  </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="skilltype-filter">기술타입:</label>
            <select
                id="skilltype-filter"
                value={selectedSkillType}
                onChange={(e) => onSkillTypeChange(e.target.value)}
                className="filter-select"
            >
              {skillTypes.map(skillType => (
                  <option key={skillType.value} value={skillType.value}>
                    {skillType.label}
                  </option>
              ))}
            </select>
          </div>

          {isFiltered && (
              <button
                  onClick={onClearFilters}
                  className="clear-filters-button"
              >
                필터 초기화
              </button>
          )}
        </div>

        <div className="filter-info">
        <span>
          {isFiltered ? '필터링된' : '전체'} 결과: {totalElements}개
        </span>
        </div>
      </div>
  );
};

export default SkillFilterSection;