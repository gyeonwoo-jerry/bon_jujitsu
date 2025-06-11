// components/admin/AdminHeader.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../styles/admin/admin.css";

const AdminHeader = () => {
    const [userRole, setUserRole] = useState("");
    const location = useLocation();

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

    // 모든 퀵링크 옵션
    const allQuickLinks = [
        { title: "회원관리", path: "/admin/members", roles: ["ADMIN", "OWNER"] },
        { title: "상품관리", path: "/admin/products", roles: ["ADMIN"] },
        { title: "주문관리", path: "/admin/orders", roles: ["ADMIN"] },
        { title: "지부관리", path: "/admin/branches", roles: ["ADMIN", "OWNER"] },
        { title: "게시판관리", path: "/admin/posts", roles: ["ADMIN", "OWNER"] },
    ];

    // 사용자 역할에 맞는 퀵링크만 필터링
    const filteredQuickLinks = allQuickLinks.filter(link =>
        link.roles.includes(userRole)
    );

    // 현재 경로가 퀵링크와 일치하는지 확인
    const isActive = (path) => {
        if (path === "/admin/posts") {
            return location.pathname.includes("/admin/posts") || location.pathname === "/admin/posts";
        }
        return location.pathname === path;
    };

    return (
        <div className="admin-header">
            <div className="admin-nav">
                {filteredQuickLinks.map((link, idx) => (
                    <Link
                        key={idx}
                        to={link.path}
                        className={`nav-link ${isActive(link.path) ? 'active' : ''}`}
                    >
                        {link.title}
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default AdminHeader;