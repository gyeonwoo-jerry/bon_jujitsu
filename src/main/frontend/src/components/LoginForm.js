import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/LoginForm.css";
import { setWithExpiry } from "../utils/storage";

function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("로그인 시도:", username);
    try {
      const response = await API.post("/users/login", {
        memberId: username,
        password: password,
      });

      if (response.status === 200) {
        if (response.data.success) {
          console.log("로그인 성공:", response.data);

          // 토큰 저장
          setWithExpiry(
            "accessToken",
            response.data.content.accessToken,
            1000 * 60 * 60
          );
          setWithExpiry(
            "refreshToken",
            response.data.content.refreshToken,
            1000 * 60 * 60 * 24
          );

          // 사용자 정보 저장 (response.data에서 데이터 추출)
          const userInfo = {
            id: response.data.content.id || response.data.content.userId || "",
            name: response.data.content.name || username, // 서버에서 이름이 없으면 아이디를 사용
            email: response.data.content.email || "",
            role: response.data.content.userRole || "", // userRole로 저장
          };

          console.log("저장할 사용자 정보:", userInfo);

          // 로컬 스토리지에 사용자 정보 저장
          localStorage.setItem("userInfo", JSON.stringify(userInfo));

          // 로그인 성공 알림
          alert("로그인 성공");

          // 로그인 성공 콜백 함수 호출 (props로 전달된 경우)
          if (onLoginSuccess && typeof onLoginSuccess === "function") {
            onLoginSuccess();
          }

          // 리디렉션 (React Router의 navigate 사용)
          navigate("/");
        } else {
          alert("아이디나 비밀번호가 일치하지 않습니다.");
          console.log("로그인 실패:", response.data);
        }
      } else {
        alert("처리 중 오류가 발생하였습니다.");
        console.log("로그인 실패:", response.data);
      }
    } catch (error) {
      console.error("로그인 실패:", error);
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("로그인 처리 중 오류가 발생했습니다.");
      }
    }
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
    console.log("Username:", e.target.value); // 콘솔에 아이디 값 출력
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    console.log("Password:", e.target.value); // 콘솔에 비밀번호 값 출력
  };

  return (
    <div className="login-form">
      <div className="loginleft">
        <img src="/images/bon_login@3x.png" alt="login_image" />
      </div>
      <div className="loginright">
        <div className="login_title">
          <h2>로그인</h2>
          <p>아이디와 비밀번호를 입력해주세요.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="login_form_input">
            <label
              htmlFor="username"
              style={{ display: username ? "none" : "block" }}
            >
              아이디
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              required
            />
          </div>
          <div className="login_form_input">
            <label
              htmlFor="password"
              style={{ display: password ? "none" : "block" }}
            >
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <button type="submit" className="login_form_button">
            로그인
          </button>
        </form>
        <div className="join_btn">
          <Link to="/join">회원가입</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
