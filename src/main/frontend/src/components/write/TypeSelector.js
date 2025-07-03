import React from 'react';

const TypeSelector = ({
  label,
  name,
  value,
  onChange,
  options,
  disabled = false
}) => {
  return (
      <div className="form-group">
        <label>{label}</label>
        <div className="type-selector">
          {options.map(option => (
              <label key={option.value} className="radio-label">
                <input
                    type="radio"
                    name={name}
                    value={option.value}
                    checked={value === option.value}
                    onChange={onChange}
                    disabled={disabled}
                />
                {option.label}
              </label>
          ))}
        </div>
      </div>
  );
};

export default TypeSelector;