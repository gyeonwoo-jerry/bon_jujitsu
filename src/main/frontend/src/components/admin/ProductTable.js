import React, { useState } from 'react';

const ProductTable = ({ products, onDelete }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  // 행 확장/축소 토글
  const toggleRowExpansion = (productId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedRows(newExpanded);
  };

  // 할인율 계산 함수 - sale이 할인된 가격이므로 수정
  const calculateDiscountRate = (price, sale) => {
    if (!price || !sale || price <= 0 || sale >= price) return 0;
    return Math.round(((price - sale) / price) * 100);
  };

  // 금액 포맷팅 함수 (기존 로직 유지)
  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  // 총 재고 계산
  const getTotalStock = (options) => {
    if (!options || options.length === 0) return 0;
    return options.reduce((total, option) => total + option.amount, 0);
  };

  // 사이즈 옵션 요약
  const getSizeSummary = (options) => {
    if (!options || options.length === 0) return '-';

    const sizes = options
    .map(opt => opt.size)
    .filter(size => size && size !== 'NONE');

    if (sizes.length === 0) return '-';
    if (sizes.length === 1) return sizes[0];

    const uniqueSizes = [...new Set(sizes)];
    if (uniqueSizes.length <= 2) {
      return uniqueSizes.join(', ');
    }
    return `${uniqueSizes[0]} 외 ${uniqueSizes.length - 1}개`;
  };

  // 색상 옵션 요약
  const getColorSummary = (options) => {
    if (!options || options.length === 0) return '-';

    const colors = options
    .map(opt => opt.color)
    .filter(color => color && color !== 'DEFAULT');

    if (colors.length === 0) return '-';

    const uniqueColors = [...new Set(colors)];
    if (uniqueColors.length === 1) return uniqueColors[0];
    return `${uniqueColors.length}가지 색상`;
  };

  // 날짜 포맷팅
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
      <div className="product-table-container">
        <table className="product-table">
          <thead>
          <tr>
            <th className="expand-header">옵션</th>
            <th>상품명</th>
            <th>사이즈</th>
            <th>색상</th>
            <th>가격</th>
            <th>수량</th>
            <th>등록일</th>
            <th>상세보기</th>
            <th>관리</th>
          </tr>
          </thead>
          <tbody>
          {products.length > 0 ? (
              products.map(product => (
                  <React.Fragment key={product.id}>
                    {/* 메인 상품 행 */}
                    <tr className="product-main-row">
                      <td className="expand-cell">
                        {product.options && product.options.length > 1 && (
                            <button
                                className="expand-toggle-btn"
                                onClick={() => toggleRowExpansion(product.id)}
                                title={expandedRows.has(product.id) ? '옵션 숨기기' : '옵션 상세보기'}
                            >
                              {expandedRows.has(product.id) ? '▲' : '▼'}
                            </button>
                        )}
                      </td>

                      <td className="product-name-cell">
                        <div className="product-name-wrapper">
                          <span className="product-name">{product.name}</span>
                          <span className="product-id">ID: {product.id}</span>
                        </div>
                      </td>

                      <td className="size-summary">
                        <div className="option-summary">
                          📦 {getSizeSummary(product.options)}
                        </div>
                      </td>

                      <td className="color-summary">
                        <div className="option-summary">
                          🎨 {getColorSummary(product.options)}
                        </div>
                      </td>

                      <td className="price-cell">
                        <div className="price-wrapper">
                          {product.sale > 0 && product.sale < product.price ? (
                              <>
                                <span className="original-price">₩{formatPrice(product.price)}</span>
                                <span className="sale-price">₩{formatPrice(product.sale)}</span>
                              </>
                          ) : (
                              <span className="current-price">₩{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </td>

                      <td className="stock-cell">
                    <span className={`stock-count ${getTotalStock(product.options) <= 10 ? 'low-stock' : ''}`}>
                      {getTotalStock(product.options)}
                    </span>
                      </td>

                      <td className="date-cell">
                        {formatDate(product.createdAt)}
                      </td>

                      <td className="detail-cell">
                        <a
                            href={`/storeDetail/${product.id}`}
                            className="detail-button"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                          상품 페이지 이동
                        </a>
                      </td>

                      <td className="action-buttons">
                        <a
                            href={`/admin/products/edit/${product.id}`}
                            className="edit-button"
                        >
                          수정
                        </a>
                        <button
                            className="delete-button"
                            onClick={() => onDelete(product.id)}
                        >
                          삭제
                        </button>
                      </td>
                    </tr>

                    {/* 확장된 옵션 상세 행 */}
                    {expandedRows.has(product.id) && product.options && product.options.length > 1 && (
                        <tr className="options-detail-row">
                          <td colSpan="9">
                            <div className="options-detail-container">
                              <h4 className="options-title">상품 옵션 상세</h4>
                              <div className="options-grid">
                                {product.options.map((option, index) => (
                                    <div key={option.id || index} className="option-card">
                                      <div className="option-header">
                                        <span className="option-number">#{index + 1}</span>
                                      </div>
                                      <div className="option-details">
                                        <div className="option-row">
                                          <span className="option-label">사이즈:</span>
                                          <span className="option-value">
                                    {option.size && option.size !== 'NONE' ? option.size : '기본'}
                                  </span>
                                        </div>
                                        <div className="option-row">
                                          <span className="option-label">색상:</span>
                                          <span className="option-value">
                                    {option.color && option.color !== 'DEFAULT' ? option.color : '기본'}
                                  </span>
                                        </div>
                                        <div className="option-row">
                                          <span className="option-label">재고:</span>
                                          <span className={`option-value stock ${option.amount <= 5 ? 'low-stock' : ''}`}>
                                    {option.amount}개
                                  </span>
                                        </div>
                                      </div>
                                    </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                    )}
                  </React.Fragment>
              ))
          ) : (
              <tr>
                <td colSpan="9" className="no-data">상품이 없습니다.</td>
              </tr>
          )}
          </tbody>
        </table>

        <style jsx>{`
          .product-table-container {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          .product-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
          }

          .product-table th {
            background: #f8f9fa;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #e9ecef;
            color: #495057;
          }

          .expand-header {
            width: 50px;
            text-align: center;
          }

          .product-table td {
            padding: 12px 8px;
            border-bottom: 1px solid #e9ecef;
            vertical-align: middle;
          }

          .expand-cell {
            text-align: center;
            width: 50px;
          }

          .expand-toggle-btn {
            background: none;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 6px 8px;
            cursor: pointer;
            color: #6c757d;
            transition: all 0.2s;
            font-size: 12px;
          }

          .expand-toggle-btn:hover {
            background: #f8f9fa;
            border-color: #007bff;
            color: #007bff;
          }

          .product-name-wrapper {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .product-name {
            font-weight: 500;
            color: #212529;
          }

          .product-id {
            font-size: 12px;
            color: #6c757d;
          }

          .option-summary {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
          }

          .discount-badge {
            background: #dc3545;
            color: white;
            padding: 2px 6px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 500;
          }

          .no-discount {
            color: #6c757d;
            font-size: 13px;
          }

          .price-wrapper {
            display: flex;
            flex-direction: column;
            gap: 2px;
          }

          .original-price {
            color: #6c757d;
            text-decoration: line-through;
            font-size: 12px;
          }

          .sale-price {
            color: #dc3545;
            font-weight: 600;
          }

          .current-price {
            color: #212529;
            font-weight: 500;
          }

          .stock-count {
            font-weight: 500;
          }

          .stock-count.low-stock {
            color: #dc3545;
          }

          .detail-button {
            color: #007bff;
            text-decoration: none;
            font-size: 13px;
            padding: 4px 8px;
            border: 1px solid #007bff;
            border-radius: 4px;
            transition: all 0.2s;
          }

          .detail-button:hover {
            background: #007bff;
            color: white;
          }

          .action-buttons {
            display: flex;
            gap: 8px;
          }

          .edit-button, .delete-button {
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
          }

          .edit-button {
            background: #28a745;
            color: white;
          }

          .edit-button:hover {
            background: #218838;
          }

          .delete-button {
            background: #dc3545;
            color: white;
          }

          .delete-button:hover {
            background: #c82333;
          }

          .options-detail-row td {
            padding: 0;
            background: #f8f9fa;
          }

          .options-detail-container {
            padding: 20px;
          }

          .options-title {
            margin: 0 0 16px 0;
            color: #495057;
            font-size: 16px;
            font-weight: 600;
          }

          .options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 16px;
          }

          .option-card {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
          }

          .option-header {
            background: #e9ecef;
            padding: 8px 12px;
            border-bottom: 1px solid #dee2e6;
          }

          .option-number {
            font-weight: 600;
            color: #495057;
            font-size: 13px;
          }

          .option-details {
            padding: 12px;
          }

          .option-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
          }

          .option-row:last-child {
            margin-bottom: 0;
          }

          .option-label {
            font-size: 13px;
            color: #6c757d;
            font-weight: 500;
          }

          .option-value {
            font-size: 13px;
            color: #212529;
          }

          .option-value.stock.low-stock {
            color: #dc3545;
            font-weight: 600;
          }

          .no-data {
            text-align: center;
            color: #6c757d;
            font-style: italic;
            padding: 40px;
          }

          .product-main-row:hover {
            background: #f8f9fa;
          }

          @media (max-width: 768px) {
            .product-table {
              font-size: 12px;
            }

            .product-table th,
            .product-table td {
              padding: 8px 4px;
            }

            .options-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
  );
};

export default ProductTable;