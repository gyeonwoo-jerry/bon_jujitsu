import React from 'react';
import '../../styles/admin/searchBar.css';

const SearchBar = ({
  searchKeyword,
  onSearchInputChange,
  onSearch
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
      <div className="search-bar">
        <form onSubmit={handleSubmit}>
          <div className="search-inputs">

            <input
                type="text"
                value={searchKeyword}
                onChange={onSearchInputChange}
                placeholder="상품명을 입력하세요"
                className="search-input"
            />

            <button type="submit" className="search-button">
              조회
            </button>
          </div>
        </form>
      </div>
  );
};

export default SearchBar;