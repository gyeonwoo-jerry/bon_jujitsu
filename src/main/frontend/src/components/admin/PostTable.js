// components/admin/PostTable.js
import React from 'react';
import "../../styles/admin/admin.css";

const PostTable = ({
                     posts,
                     loading,
                     selectedCategory,
                     userRole,
                     onDetail,
                     onEdit,
                     onDelete
                   }) => {

  // 수정 버튼 표시 여부 함수 (모든 카테고리에서 수정 버튼 표시)
  const shouldShowEditButton = () => {
    // 모든 카테고리에서 수정 버튼 표시
    return true;
  };

  // 삭제 버튼 표시 여부 함수
  const shouldShowDeleteButton = () => {
    // 모든 카테고리에서 삭제 버튼 표시 (권한이 있는 카테고리에만 접근 가능하므로)
    return true;
  };

  if (loading) {
    return <div className="loading-indicator">데이터를 불러오는 중입니다...</div>;
  }

  if (!posts || posts.length === 0) {
    return <div className="no-data-message">게시글이 없습니다.</div>;
  }

  return (
      <div className="posts-table-container">
        <table className="posts-table">
          <thead>
          <tr>
            <th className="col-num">번호</th>
            <th className="col-region">지부</th>
            <th className="col-title">제목</th>
            <th className="col-author">작성자</th>
            <th className="col-date">등록일</th>
            <th className="col-detail">상세보기</th>
            <th className="col-manage">관리</th>
            <th className="col-delete">삭제</th>
          </tr>
          </thead>
          <tbody>
          {posts.map(post => (
              <tr key={post.id}>
                <td>{post.id}</td>
                <td>{post.region}</td>
                <td className="post-title">{post.title}</td>
                <td>{post.author}</td>
                <td>{post.date}</td>
                <td>
                  <button
                      className="detail-button"
                      onClick={() => onDetail(post.id)}
                  >
                    게시판 페이지 이동
                  </button>
                </td>
                <td>
                  {shouldShowEditButton() ? (
                      <button
                          className="edit-button"
                          onClick={() => onEdit(post.id)}
                      >
                        수정
                      </button>
                  ) : (
                      <span className="no-action">-</span>
                  )}
                </td>
                <td>
                  {shouldShowDeleteButton() ? (
                      <button
                          className="delete-button"
                          onClick={() => onDelete(post.id)}
                      >
                        삭제
                      </button>
                  ) : (
                      <span className="no-action">-</span>
                  )}
                </td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  );
};

export default PostTable;