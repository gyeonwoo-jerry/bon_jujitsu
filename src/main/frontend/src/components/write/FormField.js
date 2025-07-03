import React from 'react';

const FormField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  maxLength,
  required = false,
  disabled = false,
  rows, // textarea용
  info, // 추가 정보 텍스트
  showCharCount = false
}) => {
  const isTextarea = type === 'textarea';

  const inputProps = {
    id: name,
    name,
    value,
    onChange,
    placeholder,
    maxLength,
    required,
    disabled
  };

  return (
      <div className="form-group">
        <label htmlFor={name}>
          {label} {required && '*'}
        </label>

        {isTextarea ? (
            <textarea
                {...inputProps}
                rows={rows || 15}
            />
        ) : (
            <input
                {...inputProps}
                type={type}
            />
        )}

        {showCharCount && maxLength && (
            <div className="char-count">
              {value.length}/{maxLength}
            </div>
        )}

        {info && (
            <div className="field-info">
              {info}
            </div>
        )}
      </div>
  );
};

export default FormField;