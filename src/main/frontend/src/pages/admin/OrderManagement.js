import React, { useState, useEffect, useRef } from 'react';
import API from '../../utils/api';
import OrderTable from '../../components/admin/OrderTable';
import '../../styles/admin/orderManagement.css';
import Pagination from "../../components/admin/Pagination";
import { getWithExpiry } from '../../utils/storage'; // storage 유틸리티 임포트

// 상태 변경 규칙 상수 정의 (백엔드 로직 기반)
const STATUS_TRANSITION_RULES = {
  WAITING: ['DELIVERING', 'CANCELLED'],
  DELIVERING: ['COMPLETE'],
  COMPLETE: [],
  RETURN_REQUESTED: ['RETURNING'],
  RETURNING: ['RETURNED'],
  RETURNED: [],
  CANCELLED: [],
  REFUNDED: []
};

// 상태별 오류 메시지
const STATUS_ERROR_MESSAGES = {
  WAITING: "대기중 상태는 배송중 또는 취소됨으로만 변경 가능합니다.",
  DELIVERING: "배송중 상태는 완료로만 변경 가능합니다.",
  COMPLETE: "완료 상태는 변경할 수 없습니다.",
  RETURN_REQUESTED: "반품요청 상태는 반품중으로만 변경 가능합니다.",
  RETURNING: "반품중 상태는 반품완료로만 변경 가능합니다.",
  RETURNED: "반품완료 상태는 변경할 수 없습니다.",
  CANCELLED: "취소됨 상태는 변경할 수 없습니다.",
  REFUNDED: "환불완료 상태는 변경할 수 없습니다."
};

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState("WAITING"); // 기본값 WAITING으로 설정
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isInitialMount = useRef(true);
  const apiCallInProgress = useRef(false); // API 호출 중복 방지를 위한 ref

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  const fetchOrders = async () => {
    // 이미 API 호출 중이면 중복 호출 방지
    if (apiCallInProgress.current || loading) {
      console.log('이미 API 호출 중입니다. 중복 호출 방지.');
      return;
    }

    // 토큰 확인
    if (!checkToken()) return;

    setLoading(true);
    apiCallInProgress.current = true;
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append('page', currentPage + 1); // 백엔드는 1부터 시작하므로 +1 처리
      params.append('size', 10);
      params.append('status', selectedStatus);

      console.log('API 요청 시작:', `/orders/admin?${params.toString()}`);

      const res = await API.get(`/orders/admin?${params.toString()}`);

      console.log('API 응답 데이터 타입:', typeof res.data);

      // HTML 응답 체크
      if (typeof res.data === 'string') {
        console.error('HTML 응답 감지. 인증 문제일 수 있습니다.');
        setError('서버에서 올바른 응답을 받지 못했습니다. 다시 로그인해주세요.');
        return;
      }

      if (res.data?.success) {
        const data = res.data?.content;
        console.log('성공적인 데이터 수신:', data);
        setOrders(data?.list || []);
        setTotalPages(data?.totalPage || 0);
      } else {
        console.error('조회 실패:', res.data?.message);
        setError('주문 목록을 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('API 호출 오류:', err);

      if (err.response) {
        console.error('오류 상태:', err.response.status);

        if (err.response.status === 401) {
          setError('인증에 실패했습니다. 다시 로그인해주세요.');
        } else {
          setError(`서버 오류가 발생했습니다 (${err.response.status}): ${err.message || '알 수 없는 오류'}`);
        }
      } else if (err.request) {
        setError('서버로부터 응답이 없습니다. 네트워크 연결을 확인해주세요.');
      } else {
        setError('요청 설정 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setLoading(false);
      apiCallInProgress.current = false;
    }
  };

  // 컴포넌트 마운트 시 한 번만 실행하도록 useEffect 수정
  useEffect(() => {
    // 첫 마운트 시에만 API 호출
    if (isInitialMount.current) {
      console.log('컴포넌트 첫 마운트 - fetchOrders 호출');
      isInitialMount.current = false;

      // 약간의 지연 후 API 호출 (React Strict Mode에서의 중복 마운트 문제 방지)
      const timer = setTimeout(() => {
        fetchOrders();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, []);

  // 페이지 변경 시에만 실행
  useEffect(() => {
    if (!isInitialMount.current) {
      console.log('페이지 변경 - fetchOrders 호출, 페이지:', currentPage);
      fetchOrders();
    }
  }, [currentPage]);

  const handleSearch = () => {
    console.log('조회 버튼 클릭 - fetchOrders 호출');
    setCurrentPage(0);
    fetchOrders();
  };

  // 상태 변경 가능 여부 확인
  const canChangeStatus = (currentStatus, newStatus) => {
    return STATUS_TRANSITION_RULES[currentStatus]?.includes(newStatus);
  };

  // 상태 변경 오류 메시지 가져오기
  const getStatusErrorMessage = (currentStatus, newStatus) => {
    if (!canChangeStatus(currentStatus, newStatus)) {
      return STATUS_ERROR_MESSAGES[currentStatus] || "현재 상태에서는 요청한 상태로 변경할 수 없습니다.";
    }
    return null;
  };

  const handleStatusChange = async (orderId, newStatus = null, openDropdown = false) => {
    if (openDropdown) {
      setSelectedOrderId(prev => (prev === orderId ? null : orderId));
      return;
    }

    if (!newStatus) return;

    // 토큰 확인
    if (!checkToken()) return;

    // 해당 주문 찾기
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      alert('주문 정보를 찾을 수 없습니다.');
      return;
    }

    // 상태 변경 가능 여부 확인
    const errorMessage = getStatusErrorMessage(order.orderStatus, newStatus);
    if (errorMessage) {
      alert(errorMessage);
      return;
    }

    setIsChangingStatus(true);
    setSelectedOrderId(orderId);

    try {
      console.log('상태 변경 요청:', { orderId, status: newStatus });

      const res = await API.patch('/orders/admin', {
        orderId,
        status: newStatus,
      });

      if (res.data?.success) {
        alert('상태 변경 완료');
        fetchOrders();
      } else {
        alert('변경 실패: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('상태 변경 오류:', err);

      // 서버 응답 오류 처리
      if (err.response?.data?.message) {
        // 백엔드에서 보낸 구체적인 오류 메시지 표시
        alert('변경 실패: ' + err.response.data.message);
      } else if (err.response && err.response.status === 401) {
        alert('인증에 실패했습니다. 다시 로그인해주세요.');
      } else {
        alert('에러 발생: ' + (err.message || '알 수 없는 오류'));
      }
    } finally {
      setIsChangingStatus(false);
      setSelectedOrderId(null);
    }
  };

  return (
      <div className="order-management">
        <h2 className="title">주문관리(주문리스트)</h2>

        {error && (
            <div className="error-message" style={{
              backgroundColor: '#fde2e2',
              color: '#d32f2f',
              padding: '10px',
              borderRadius: '4px',
              margin: '10px 0',
              borderLeft: '4px solid #d32f2f'
            }}>
              {error}
            </div>
        )}

        <div className="search-section">
          <div className="status-filter">
            <span>주문상태</span>
            <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="WAITING">대기중</option>
              <option value="DELIVERING">배송중</option>
              <option value="COMPLETE">완료</option>
              <option value="CANCELLED">취소됨</option>
              <option value="RETURN_REQUESTED">반품요청</option>
              <option value="RETURNING">반품중</option>
              <option value="RETURNED">반품완료</option>
              <option value="REFUNDED">환불완료</option>
            </select>
          </div>
          <button
              className="search-button"
              onClick={handleSearch}
              disabled={loading}
              style={loading ? { backgroundColor: '#cccccc', cursor: 'not-allowed' } : {}}
          >
            {loading ? '로딩중...' : '조회'}
          </button>
        </div>

        {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '14px', color: '#666' }}>
              데이터를 불러오는 중입니다...
            </div>
        ) : (
            <>
              <OrderTable
                  orders={orders}
                  selectedOrderId={selectedOrderId}
                  isChangingStatus={isChangingStatus}
                  onStatusChange={handleStatusChange}
                  statusRules={STATUS_TRANSITION_RULES}
              />

              {orders.length > 0 && (
                  <Pagination
                      currentPage={currentPage + 1}
                      totalPages={totalPages}
                      onPageChange={(page) => setCurrentPage(page - 1)}
                  />
              )}
            </>
        )}
      </div>
  );
};

export default OrderManagement;