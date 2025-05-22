// pages/AdminMain.js
import React, { useEffect, useState } from "react";
import SummaryCard from "../../components/admin/SummaryCard";
import QuickLinkButton from "../../components/admin/QuickLinkButton";
import "../../styles/admin/adminMain.css";

const AdminMain = () => {
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    // 로그인한 사용자 정보 가져오기
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        setUserRole(user.role || "");
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
      }
    }
  }, []);

  const summaryCards = [
    { label: "주문 승인 대기", value: 5 },
    { label: "재고 부족 상품", value: 3 },
    { label: "오늘 매출", value: "₩1,200,000" },
  ];

  // 모든 퀵링크 옵션
  const allQuickLinks = [
    { title: "회원관리", path: "/admin/members", roles: ["ADMIN", "OWNER"] },
    { title: "상품관리", path: "/admin/products", roles: ["ADMIN"] },
    { title: "주문관리", path: "/admin/orders", roles: ["ADMIN"] },
    { title: "지부관리", path: "/admin/branches", roles: ["ADMIN", "OWNER"] },
    { title: "게시판관리", path: "/admin/boards", roles: ["ADMIN", "OWNER"] },
  ];

  // 사용자 역할에 맞는 퀵링크만 필터링
  const filteredQuickLinks = allQuickLinks.filter(link =>
      link.roles.includes(userRole)
  );

  return (
      <div className="admin-main">
        <h2>관리자 MAIN PAGE</h2>

        <div className="summary-cards">
          {/* ADMIN만 요약 카드를 볼 수 있게 설정 */}
          {userRole === "ADMIN" &&
              summaryCards.map((card, idx) => (
                  <SummaryCard key={idx} {...card} />
              ))
          }
        </div>

        <div className="quick-links">
          {filteredQuickLinks.map((link, idx) => (
              <QuickLinkButton key={idx} title={link.title} path={link.path} />
          ))}
        </div>
      </div>
  );
};

export default AdminMain;