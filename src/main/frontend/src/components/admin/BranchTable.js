import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin/branchTable.css';

const BranchTable = ({ branches, onDelete }) => {
  return (
      <div className="branch-table-container">
        <table className="branch-table">
          <thead>
          <tr>
            <th>지부명</th>
            <th>지역</th>
            <th>주소</th>
            <th>상세보기</th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          {branches.length > 0 ? (
              branches.map(branch => (
                  <tr key={branch.id}>
                    <td>{branch.region}</td>
                    <td>{branch.area}</td>
                    <td>{branch.address}</td>
                    <td>
                      <Link
                          to={`/storeDetail/branch/${branch.id}`}
                          className="detail-button"
                          target="_blank"
                          rel="noopener noreferrer"
                      >
                        지부 페이지 이동
                      </Link>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <Link
                            to={`/admin/branches/edit/${branch.id}`}
                            className="edit-button"
                        >
                          수정
                        </Link>
                        <button
                            className="delete-button"
                            onClick={() => onDelete(branch.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
              ))
          ) : (
              <tr>
                <td colSpan="5" className="no-data">지부가 없습니다.</td>
              </tr>
          )}
          </tbody>
        </table>
      </div>
  );
};

export default BranchTable;
