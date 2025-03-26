import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../utils/api";
import "../styles/LoginForm.css";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("로그인 성공:", username);
    try {
      const response = await API.post("/users/login", {
        memberId: username,
        password: password,
      });
      if (response.status === 200) {
        if (response.data.success) {
          console.log("로그인 성공:", response.data);
          // 로그인 성공 후 처리 (예: 토큰 저장, 리다이렉트 등)
          localStorage.setItem("token", response.data.token);
          window.location.href = "/";
        } else {
          alert("아이디나 비밀번호가 일치하지 않습니다.");
          console.log("로그인 실패:", response.data);
        }
      } else {
        alert("처리 중 오류가 발생하였습니다.");
        console.log("로그인 실패:", response.data);
      }
      // 우아
    } catch (error) {
      console.error("로그인 실패:", error);
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
