import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LoginForm from './LoginForm'; 

function Navbar() {
  const [showLoginForm, setShowLoginForm] = useState(false);

  const toggleLoginForm = () => {
    setShowLoginForm(!showLoginForm);
  };

  return (
    <nav className='main_nav'>
      <ul>
        <li><Link to="/">홈</Link></li>
        <li><Link to="/academy">아카데미</Link></li>
        <li><Link to="/brunches">지부소개</Link></li>
        <li><Link to="/store">스토어</Link></li>
        <li className='logo'>
            <Link to="/">
                <img src="/images/logo.png" alt="logo" />   
            </Link>
        </li>  
        <li><Link to="/skill">기술</Link></li>
        <li><Link to="/news">뉴스</Link></li>
        <li><Link to="/qna">질문</Link></li>
        <li><Link to="/sponsor">제휴업체</Link></li>
      </ul>
      <div className="login_btn" onClick={toggleLoginForm}>
        로그인
      </div>
      {showLoginForm && <LoginForm />} 
    </nav>
  );
}

export default Navbar; 