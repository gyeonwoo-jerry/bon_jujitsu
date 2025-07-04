import React from 'react';

const ErrorMessage = ({ title, message, onBack }) => {
  return (
      <div className="error-message">
        <h3>{title}</h3>
        {message && <p>{message}</p>}
        {onBack && (
            <button onClick={onBack} className="btn-secondary">
              돌아가기
            </button>
        )}
      </div>
  );
};

export default ErrorMessage;