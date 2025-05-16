import React from 'react';
import '../../styles/admin/orderTable.css';

const OrderTable = ({
  orders,
  isChangingStatus,
  selectedOrderId,
  onStatusChange,
  statusRules = {} // 상태 변경 규칙 전달받음
}) => {
  const orderStatusOptions = [
    { value: 'WAITING', label: '대기중' },
    { value: 'DELIVERING', label: '배송중' },
    { value: 'COMPLETE', label: '완료' },
    { value: 'CANCELLED', label: '취소됨' },
    { value: 'RETURN_REQUESTED', label: '반품요청' },
    { value: 'RETURNING', label: '반품중' },
    { value: 'RETURNED', label: '반품완료' },
    { value: 'REFUNDED', label: '환불완료' },
  ];

  const getStatusDisplay = (status) => {
    const option = orderStatusOptions.find(o => o.value === status);
    return option ? option.label : status;
  };

  // 현재 상태에서 변경 가능한 상태 필터링
  const getAvailableStatusOptions = (currentStatus) => {
    // statusRules가 정의되지 않았거나 현재 상태에 대한 규칙이 없으면 모든 옵션 반환
    if (!statusRules || !statusRules[currentStatus]) {
      return orderStatusOptions;
    }

    // 현재 상태와 변경 가능한 상태만 반환
    return orderStatusOptions.filter(option =>
        option.value === currentStatus || statusRules[currentStatus].includes(option.value)
    );
  };

  const renderStatusDropdown = (order) => {
    const availableOptions = getAvailableStatusOptions(order.orderStatus);

    return (
        <div className="status-dropdown">
          <div
              className={`status-badge status-${order.orderStatus.toLowerCase()}`}
              onClick={() => onStatusChange(order.id, null, true)}
          >
            {getStatusDisplay(order.orderStatus)}
            <span className="dropdown-arrow">▼</span>
          </div>

          {selectedOrderId === order.id && (
              <div className="status-options">
                {availableOptions.map(option => (
                    <div
                        key={option.value}
                        className={`status-option ${option.value === order.orderStatus ? 'current' : ''} ${!statusRules[order.orderStatus]?.includes(option.value) && option.value !== order.orderStatus ? 'disabled' : ''}`}
                        onClick={() => {
                          if (option.value !== order.orderStatus && statusRules[order.orderStatus]?.includes(option.value)) {
                            onStatusChange(order.id, option.value);
                          }
                        }}
                    >
                      {option.label}
                      {option.value === order.orderStatus && <span className="check-mark">✓</span>}
                      {!statusRules[order.orderStatus]?.includes(option.value) && option.value !== order.orderStatus && (
                          <span className="lock-icon" title="현재 상태에서 변경할 수 없습니다">🔒</span>
                      )}
                    </div>
                ))}
              </div>
          )}
        </div>
    );
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
      <div className="order-table-container">
        <table className="order-table">
          <thead>
          <tr>
            <th>번호</th>
            <th>주문자</th>
            <th>연락처</th>
            <th>우편번호</th>
            <th>주소</th>
            <th>상세주소</th>
            <th>요구사항</th>
            <th>결제수단</th>
            <th>결제금액</th>
            <th>수량</th>
            <th>상품명</th>
            <th>주문일시</th>
            <th>주문상태</th>
          </tr>
          </thead>
          <tbody>
          {orders.length > 0 ? (
              orders.map(order => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.name || '-'}</td>
                    <td>{order.phoneNum || '-'}</td>
                    <td>{order.zipcode || '-'}</td>
                    <td>{order.address || '-'}</td>
                    <td>{order.addrDetail || '-'}</td>
                    <td>{order.requirement || '-'}</td>
                    <td>{order.payType || '-'}</td>
                    <td>{order.totalPrice?.toLocaleString() || '-'}</td>
                    <td>{order.totalCount || '-'}</td>
                    <td>{order.orderItems?.[0]?.itemName || '-'}</td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      {isChangingStatus && selectedOrderId === order.id ? (
                          <div className="loading">처리중...</div>
                      ) : (
                          renderStatusDropdown(order)
                      )}
                    </td>
                  </tr>
              ))
          ) : (
              <tr>
                <td colSpan="13" className="no-data">주문 내역이 없습니다.</td>
              </tr>
          )}
          </tbody>
        </table>
      </div>
  );
};

export default OrderTable;