import React from 'react';

const SearchSection = ({
  searchQuery,
  searchType,
  onSearchQueryChange,
  onSearchTypeChange,
  onSearch,
  totalElements,
  onClearSearch,
  searchTypes = [
    { value: 'title', label: '제목' },
    { value: 'author', label: '작성자' },
    { value: 'content', label: '내용' }
  ],
  placeholder = "제목으로 검색..."
}) => {
  return (
      <div className="search-section">
        <form onSubmit={onSearch} className="search-form">
          <select
              value={searchType}
              onChange={(e) => onSearchTypeChange(e.target.value)}
              className="search-type-select"
          >
            {searchTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
            ))}
          </select>
          <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder={placeholder}
              className="search-input"
          />
          <button type="submit" className="search-button">
            검색
          </button>
        </form>

        {searchQuery && (
            <div className="search-info">
              <span>"{searchQuery}" 검색 결과: {totalElements}개</span>
              <button onClick={onClearSearch} className="clear-search-button">
                검색 초기화
              </button>
            </div>
        )}
      </div>
  );
};

export default SearchSection;