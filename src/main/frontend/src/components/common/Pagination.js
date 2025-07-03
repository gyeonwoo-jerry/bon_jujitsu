import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (currentPage > 1) {
    pageNumbers.push(
        <button
            key="prev"
            onClick={() => onPageChange(currentPage - 1)}
            className="pagination-button"
        >
          이전
        </button>
    );
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(
        <button
            key={i}
            onClick={() => onPageChange(i)}
            className={`pagination-button ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
    );
  }

  if (currentPage < totalPages) {
    pageNumbers.push(
        <button
            key="next"
            onClick={() => onPageChange(currentPage + 1)}
            className="pagination-button"
        >
          다음
        </button>
    );
  }

  return <div className="pagination-container">{pageNumbers}</div>;
};

export default Pagination;