import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginForm from "./LoginForm";
import "../styles/navbar.css";
import { getWithExpiry } from "../utils/storage";
import API from "../utils/api";

function Navbar() {
  const [isFixed, setIsFixed] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("");
  const navigate = useNavigate();

  // 스크롤 이벤트 처리
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsFixed(true);
      } else {
        setIsFixed(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = getWithExpiry("accessToken");
      const userInfo = localStorage.getItem("userInfo");

      if (token && userInfo) {
        try {
          const user = JSON.parse(userInfo);
          setIsLoggedIn(true);
          setUserName(user.name || "사용자"); // 이름이 없으면 '사용자'로 표시
          setUserRole(user.role || ""); // role 값도 설정
        } catch (error) {
          console.error("사용자 정보 파싱 오류:", error);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();

    // 로그인 상태 변경 시 확인하기 위한 이벤트 리스너
    window.addEventListener("storage", checkLoginStatus);

    return () => {
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
  };

  const handleLogout = async () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
      // 로컬 스토리지에서 토큰과 사용자 정보 삭제

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userInfo");

      // 상태 업데이트
      setIsLoggedIn(false);
      setUserName("");
      setUserRole("");

      // 로그 아웃 tr 호출
      try {
        const response = await API.post("/logout");
        console.log("로그아웃 응답:", response);
      } catch (error) {
        console.error("로그아웃 오류:", error);
      }

      // 필요한 경우 홈페이지로 리디렉션
      navigate("/");
    }
  };

  return (
    <nav className={`main_nav ${isFixed ? "fixed" : ""}`}>
      <ul>
        <li>
          <Link to="/">홈</Link>
        </li>
        <li>
          <Link to="/academy">아카데미</Link>
        </li>
        <li>
          <Link to="/branches">지부소개</Link>
        </li>
        <li>
          <Link to="/store">스토어</Link>
        </li>
        <li className="logo">
          <Link to="/">
            <img src="/images/logo.png" alt="logo" />
          </Link>
        </li>
        <li>
          <Link to="/skill">기술</Link>
        </li>
        <li>
          <Link to="/news">뉴스</Link>
        </li>
        <li>
          <Link to="/qna">질문</Link>
        </li>
        <li>
          <Link to="/sponsor">제휴업체</Link>
        </li>
      </ul>

      {isLoggedIn ? (
        // 로그인 상태일 때 사용자 정보와 로그아웃 버튼 표시
        <div className="user_status">
          <span className="user_name">
            {userName}{" "}
            {userRole === "USER" && "님,"}
            {userRole === "OWNER" && "관장님,"}
            {userRole === "COACH" && "코치님,"}
            {userRole === "ADMIN" && "관리자님,"} 환영합니다
          </span>

          {userRole === "ADMIN" && (
              <button
                  className="admin_btn"
                  onClick={() => navigate("/admin")}
                  style={{ marginLeft: "12px" }}
              >
                관리자 페이지
              </button>
          )}

          <button className="logout_btn" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      ) : (
        // 로그인 상태가 아닐 때 로그인 버튼 표시
        <div className="login_btn" onClick={toggleLoginForm}>
          로그인
        </div>
      )}

      {showLoginForm && !isLoggedIn && (
        <LoginForm
          onLoginSuccess={() => {
            setShowLoginForm(false);
            // 로그인 성공 시 상태 업데이트
            const userInfo = localStorage.getItem("userInfo");
            if (userInfo) {
              try {
                const user = JSON.parse(userInfo);
                setIsLoggedIn(true);
                setUserName(user.name || "사용자");
                setUserRole(user.role || ""); // role 값도 업데이트
              } catch (error) {
                console.error("사용자 정보 파싱 오류:", error);
              }
            }
          }}
        />
      )}
    </nav>
  );
}

export default Navbar;
