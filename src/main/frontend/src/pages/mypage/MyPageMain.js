// pages/MyPageMain.js
import React, { useEffect, useState } from "react";
import MyPageHeader from "../../components/MyPageHeader";
import {
  MyPageSummaryCard,
  MyPageQuickLinkButton,
  MyPageStatusBadge,
  MyPageAlert
} from "../../components/MyPageComponents";
import "../../styles/mypage.css";

const MyPageMain = () => {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
    const storedUserInfo = localStorage.getItem("userInfo");
    if (storedUserInfo) {
      try {
        const user = JSON.parse(storedUserInfo);
        setUserRole(user.role || "");
        setUserName(user.name || "");
        setUserInfo(user);
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
      }
    }
  }, []);

  // 요약 카드 클릭 핸들러
  const handleSummaryCardClick = (cardType) => {
    switch (cardType) {
      case 'orders':
        window.location.href = '/mypage/orders';
        break;
      case 'cart':
        window.location.href = '/mypage/cart';
        break;
      case 'reviews':
        window.location.href = '/mypage/reviews';
        break;
      case 'inquiries':
        window.location.href = '/mypage/inquiries';
        break;
      case 'management':
        window.location.href = '/admin/management';
        break;
      default:
        break;
    }
  };

  // 마이페이지 요약 정보 카드 (실제 기능 기반)
  const summaryCards = [
    {
      label: "최근 주문",
      value: "확인하기",
      description: "주문 내역을 확인해보세요",
      color: "blue",
      icon: "📦",
      onClick: () => handleSummaryCardClick('orders'),
      loading: loading
    },
    {
      label: "장바구니",
      value: "보기",
      description: "담아둔 상품을 확인하세요",
      color: "green",
      icon: "🛒",
      onClick: () => handleSummaryCardClick('cart'),
      loading: loading
    },
    {
      label: "작성 가능한 리뷰",
      value: "작성하기",
      description: "구매한 상품의 리뷰를 남겨주세요",
      color: "orange",
      icon: "⭐",
      onClick: () => handleSummaryCardClick('reviews'),
      loading: loading
    },
    {
      label: "문의하기",
      value: "1:1 문의",
      description: "궁금한 점을 문의해주세요",
      color: "purple",
      icon: "💬",
      onClick: () => handleSummaryCardClick('inquiries'),
      loading: loading
    },
    // OWNER 전용 요약 카드
    ...(userRole === "OWNER" ? [{
      label: "관리자 메뉴",
      value: "관리하기",
      description: "시스템 관리 및 설정",
      color: "red",
      icon: "⚙️",
      onClick: () => handleSummaryCardClick('management'),
      loading: loading
    }] : [])
  ];

  // 모든 퀵링크 옵션
  const allQuickLinks = [
    {
      title: "주문/배송 내역",
      path: "/mypage/orders",
      roles: ["USER", "COACH", "OWNER"],
      icon: "📦",
      description: "주문 내역과 배송 상태를 확인하세요"
    },
    {
      title: "회원 정보 관리",
      path: "/mypage/profile/edit",
      roles: ["USER", "COACH", "OWNER"],
      icon: "👤",
      description: "개인정보와 계정 설정을 변경하세요"
    },
    {
      title: "리뷰 작성/관리",
      path: "/mypage/reviews",
      roles: ["USER", "COACH", "OWNER"],
      icon: "⭐",
      description: "구매한 상품의 리뷰를 작성하고 관리하세요"
    },
    {
      title: "1:1 문의 내역",
      path: "/mypage/inquiries",
      roles: ["USER", "COACH", "OWNER"],
      icon: "💬",
      description: "고객센터 문의 내역을 확인하세요"
    },
    {
      title: "장바구니",
      path: "/mypage/cart",
      roles: ["USER", "COACH", "OWNER"],
      icon: "🛒",
      description: "담아둔 상품을 확인하고 주문하세요"
    },
    // OWNER 전용 퀵링크
    {
      title: "회원 관리",
      path: "/admin/users",
      roles: ["OWNER"],
      icon: "👥",
      description: "전체 회원 정보를 관리하세요"
    },
    {
      title: "상품 관리",
      path: "/admin/products",
      roles: ["OWNER"],
      icon: "📦",
      description: "상품 등록 및 관리를 하세요"
    },
    {
      title: "주문 관리",
      path: "/admin/orders",
      roles: ["OWNER"],
      icon: "📋",
      description: "전체 주문 내역을 관리하세요"
    },
    {
      title: "시스템 설정",
      path: "/admin/settings",
      roles: ["OWNER"],
      icon: "⚙️",
      description: "시스템 전반적인 설정을 관리하세요"
    }
  ];

  // 사용자 역할에 맞는 퀵링크만 필터링
  const filteredQuickLinks = allQuickLinks.filter(link =>
      link.roles.includes(userRole)
  );

  // 최근 활동 정보 (실제 주짓수 관련 활동)
  const recentActivities = [
    {
      type: "login",
      message: "마이페이지에 로그인했습니다",
      time: "방금 전",
      status: "active",
      badgeStatus: "success",
      badgeText: "활성"
    },
    {
      type: "profile",
      message: "회원 정보를 확인해보세요",
      time: "",
      status: "pending",
      badgeStatus: "info",
      badgeText: "확인 필요"
    },
    {
      type: "store",
      message: "새로운 주짓수 용품을 확인해보세요",
      time: "",
      status: "available",
      badgeStatus: "warning",
      badgeText: "신상품"
    }
  ];

  return (
      <div className="mypage_main">
        <MyPageHeader />

        <div className="mypage_contents">
          <div className="title">
            {userName}
            {userRole === "USER" && "님의 마이페이지"}
            {userRole === "COACH" && " 코치님의 마이페이지"}
            {userRole === "OWNER" && " 관리자님의 마이페이지"}
          </div>

          {/* 환영 메시지 */}
          <MyPageAlert
              type="info"
              title="환영합니다!"
              message="본 주짓수 마이페이지에서 다양한 서비스를 이용하실 수 있습니다."
              closable={true}
          />

          {/* 요약 정보 카드 */}
          <div className="summary-cards">
            {summaryCards.map((card, idx) => (
                <MyPageSummaryCard key={idx} {...card} />
            ))}
          </div>

          {/* 퀵링크 섹션 */}
          <div className="quick-links">
            <div className="section-title">빠른 메뉴</div>
            <div className="quick-links-grid">
              {filteredQuickLinks.map((link, idx) => (
                  <MyPageQuickLinkButton
                      key={idx}
                      title={link.title}
                      path={link.path}
                      icon={link.icon}
                      description={link.description}
                      disabled={false}
                      external={false}
                  />
              ))}
            </div>
          </div>

          {/* 최근 활동 섹션 */}
          <div className="recent-activities">
            <div className="section-title">활동 현황</div>
            <div className="activities-list">
              {recentActivities.map((activity, idx) => (
                  <div key={idx} className={`activity-item ${activity.status}`}>
                    <div className="activity-icon">
                      {activity.type === "login" && "🚪"}
                      {activity.type === "profile" && "👤"}
                      {activity.type === "store" && "🛍️"}
                    </div>
                    <div className="activity-content">
                      <p className="activity-message">{activity.message}</p>
                      {activity.time && <span className="activity-time">{activity.time}</span>}
                    </div>
                    <MyPageStatusBadge
                        status={activity.badgeStatus}
                        text={activity.badgeText}
                        size="small"
                    />
                  </div>
              ))}
            </div>
          </div>

          {/* 주짓수 관련 정보 */}
          <div className="member-benefits">
            <div className="section-title">주짓수 정보</div>
            <div className="benefits-card">
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">🥋</span>
                  <span className="benefit-text">나의 벨트 등급: {userInfo?.stripe || 'WHITE'}</span>
                  <MyPageStatusBadge
                      status="info"
                      text={userInfo?.stripe || 'WHITE'}
                      size="small"
                  />
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📈</span>
                  <span className="benefit-text">나의 레벨: {userInfo?.level || '1'}단계</span>
                  <MyPageStatusBadge
                      status="success"
                      text={`${userInfo?.level || '1'}단계`}
                      size="small"
                  />
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🏢</span>
                  <span className="benefit-text">소속 지부 정보 확인</span>
                  <MyPageStatusBadge
                      status="warning"
                      text="확인하기"
                      size="small"
                  />
                </div>
                {userRole === "COACH" && (
                    <div className="benefit-item">
                      <span className="benefit-icon">👨‍🏫</span>
                      <span className="benefit-text">코치 인증 사용자</span>
                      <MyPageStatusBadge
                          status="success"
                          text="COACH"
                          size="small"
                      />
                    </div>
                )}
                {userRole === "OWNER" && (
                    <div className="benefit-item">
                      <span className="benefit-icon">👑</span>
                      <span className="benefit-text">관리자 권한 사용자</span>
                      <MyPageStatusBadge
                          status="error"
                          text="OWNER"
                          size="small"
                      />
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* 빠른 링크 */}
          <div className="quick-access">
            <div className="section-title">바로가기</div>
            <div className="benefits-card">
              <div className="benefits-list">
                <div className="benefit-item">
                  <span className="benefit-icon">🛍️</span>
                  <span className="benefit-text">스토어에서 주짓수 용품 구매</span>
                  <button
                      onClick={() => window.location.href = '/store'}
                      className="benefit-button"
                  >
                    스토어 이동
                  </button>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📚</span>
                  <span className="benefit-text">주짓수 기술 영상 시청</span>
                  <button
                      onClick={() => window.location.href = '/skill'}
                      className="benefit-button"
                  >
                    기술 보기
                  </button>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">📰</span>
                  <span className="benefit-text">최신 주짓수 뉴스 확인</span>
                  <button
                      onClick={() => window.location.href = '/news'}
                      className="benefit-button"
                  >
                    뉴스 보기
                  </button>
                </div>
                {userRole === "OWNER" && (
                    <div className="benefit-item">
                      <span className="benefit-icon">📊</span>
                      <span className="benefit-text">전체 통계 및 관리</span>
                      <button
                          onClick={() => window.location.href = '/admin/dashboard'}
                          className="benefit-button"
                      >
                        관리자 대시보드
                      </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default MyPageMain;