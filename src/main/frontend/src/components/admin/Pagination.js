import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // 페이지가 1페이지만 있으면 페이지네이션 표시 안함
  if (totalPages <= 1) return null;

  // 보여줄 페이지 번호 계산 (최대 5개)
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;

    // 시작 페이지와 끝 페이지 계산
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    // 페이지 범위 조정
    if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    // 페이지 번호 배열 생성
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
      <div className="pagination-container">
        {/* 이전 버튼 */}
        <button
            className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
        >
          &lt;
        </button>

        {/* 첫 페이지로 가기 버튼 - 현재 페이지가 4보다 클 때만 표시 */}
        {currentPage > 3 && (
            <>
              <button
                  className="pagination-button"
                  onClick={() => onPageChange(1)}
              >
                1
              </button>
              {currentPage > 4 && <span className="pagination-ellipsis">...</span>}
            </>
        )}

        {/* 페이지 번호 버튼 */}
        {pageNumbers.map(number => (
            <button
                key={number}
                className={`pagination-button ${number === currentPage ? 'active' : ''}`}
                onClick={() => onPageChange(number)}
            >
              {number}
            </button>
        ))}

        {/* 마지막 페이지로 가기 버튼 - 최대 페이지보다 3페이지 이상 적을 때만 표시 */}
        {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="pagination-ellipsis">...</span>}
              <button
                  className="pagination-button"
                  onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
        )}

        {/* 다음 버튼 */}
        <button
            className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
            onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
        >
          &gt;
        </button>
      </div>
  );
};

export default Pagination;