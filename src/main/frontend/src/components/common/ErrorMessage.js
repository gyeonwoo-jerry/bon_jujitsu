import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
  return (
      <div className="error-message">
        <p>{message}</p>
        {onRetry && (
            <button onClick={onRetry} className="retry-button">
              다시 시도
            </button>
        )}
      </div>
  );
};

export default ErrorMessage;