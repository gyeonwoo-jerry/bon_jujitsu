// pages/adminMain.js
import React from "react";
import SummaryCard from "../../components/admin/SummaryCard";
import QuickLinkButton from "../../components/admin/QuickLinkButton";
import "../../styles/admin/adminMain.css";

const AdminMain = () => {
  const summaryCards = [
    { label: "주문 승인 대기", value: 5 },
    { label: "재고 부족 상품", value: 3 },
    { label: "오늘 매출", value: "₩1,200,000" },
  ];

  const quickLinks = [
    { title: "회원관리", path: "/admin/members" },
    { title: "상품관리", path: "/admin/products" },
    { title: "주문관리", path: "/admin/orders" },
    { title: "지부관리", path: "/admin/branches" },
    { title: "게시판관리", path: "/admin/boards" },
  ];

  return (
      <div className="admin-main">
        <h2>관리자 MAIN PAGE</h2>

        <div className="summary-cards">
          {summaryCards.map((card, idx) => (
              <SummaryCard key={idx} {...card} />
          ))}
        </div>

        <div className="quick-links">
          {quickLinks.map((link, idx) => (
              <QuickLinkButton key={idx} {...link} />
          ))}
        </div>
      </div>
  );
};

export default AdminMain;
