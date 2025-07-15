// components/mypage/MyPageHeader.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/mypage.css";

const MyPageHeader = () => {
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");
  const location = useLocation();

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserRole(user.role || "");
        setUserName(user.name || "");
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
      }
    }
  }, []);

  // 모든 마이페이지 메뉴 옵션 (OWNER 포함)
  const allMyPageLinks = [
    { title: "주문/배송 내역", path: "/mypage/orders", roles: ["USER", "COACH", "OWNER"] },
    { title: "회원 정보 관리", path: "/mypage/profile/edit", roles: ["USER", "COACH", "OWNER"] },
    { title: "리뷰 작성/관리", path: "/mypage/reviews", roles: ["USER", "COACH", "OWNER"] },
    { title: "1:1 문의", path: "/mypage/inquiries", roles: ["USER", "COACH", "OWNER"] },
    { title: "장바구니", path: "/mypage/cart", roles: ["USER", "COACH", "OWNER"] },
    // OWNER 전용 메뉴 (관리자 기능 바로가기)
    { title: "관리자 메뉴", path: "/admin", roles: ["OWNER"] },
  ];

  // 사용자 역할에 맞는 메뉴만 필터링
  const filteredMyPageLinks = allMyPageLinks.filter(link =>
      link.roles.includes(userRole)
  );

  // 현재 경로가 메뉴와 일치하는지 확인
  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
      <div className="mypage-header">
        {/* 사용자 정보 표시 */}
        <div className="user-info-section">
          <div className="user-avatar">
            <span className="avatar-text">
              {userName ? userName.charAt(0) : 'U'}
            </span>
          </div>
          <div className="user-details">
            <h2 className="user-name">
              {userName}
              {userRole === "USER" && "님"}
              {userRole === "COACH" && " 코치님"}
              {userRole === "OWNER" && " 관장님"}
            </h2>
            <p className="user-role">
              {userRole === "USER" && "일반 회원"}
              {userRole === "COACH" && "코치"}
              {userRole === "OWNER" && "관장"}
            </p>
          </div>
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="mypage-nav">
          {filteredMyPageLinks.map((link, idx) => (
              <Link
                  key={idx}
                  to={link.path}
                  className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
              >
                <span className="nav-icon">
                  {link.title === "주문/배송 내역" && "📦"}
                  {link.title === "회원 정보 관리" && "👤"}
                  {link.title === "리뷰 작성/관리" && "⭐"}
                  {link.title === "1:1 문의" && "💬"}
                  {link.title === "장바구니" && "🛒"}
                  {link.title === "관리자 메뉴" && "⚙️"}
                </span>
                {link.title}
              </Link>
          ))}
        </div>
      </div>
  );
};

export default MyPageHeader;