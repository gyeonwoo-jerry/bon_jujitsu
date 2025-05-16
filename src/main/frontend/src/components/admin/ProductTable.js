import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin/productTable.css';

const ProductTable = ({ products, onDelete }) => {
  // 할인율 계산 함수
  const calculateDiscountRate = (price, sale) => {
    if (!price || !sale || price <= 0) return 0;
    return Math.round(((price - sale) / price) * 100);
  };

  // 금액 포맷팅 함수
  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  return (
      <div className="product-table-container">
        <table className="product-table">
          <thead>
          <tr>
            <th>상품명</th>
            <th>사이즈</th>
            <th>할인</th>
            <th>가격</th>
            <th>수량</th>
            <th>상세보기</th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          {products.length > 0 ? (
              products.map(product => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>
                      {product.options && product.options.length > 0
                          ? product.options[0].size
                          : '-'
                      }
                    </td>
                    <td>{calculateDiscountRate(product.price, product.sale)}%</td>
                    <td>{formatPrice(product.price)}</td>
                    <td>
                      {product.options && product.options.length > 0
                          ? product.options.reduce((total, option) => total + option.amount, 0)
                          : 0
                      }
                    </td>
                    <td>
                      <button
                          className="detail-button"
                          disabled
                          title="준비 중인 기능입니다"
                      >
                        상품 페이지 이동
                      </button>
                    </td>
                    <td className="action-buttons">
                      <Link
                          to={`/admin/products/edit/${product.id}`}
                          className="edit-button"
                      >
                        수정
                      </Link>
                      <button
                          className="delete-button"
                          onClick={() => onDelete(product.id)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
              ))
          ) : (
              <tr>
                <td colSpan="7" className="no-data">상품이 없습니다.</td>
              </tr>
          )}
          </tbody>
        </table>
      </div>
  );
};

export default ProductTable;