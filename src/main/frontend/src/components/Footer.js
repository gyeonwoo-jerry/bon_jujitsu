import React from 'react';
import '../styles/Footer.css'; // 스타일을 위한 CSS 파일을 import합니다.
import { Link } from 'react-router-dom';

function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="footer">
            <div className='footer_container'>
                <div className="footer-content">
                    <div className="footer-left">
                        <img src="/images/logo-footer-wt.png" alt="Logo" className="footer-logo" />
                        <div className='foot_tit'>본주짓수</div>
                        <div className='foot_info'>서울 영등포구 당산로 233 유림빌딩 4층 (우)07222</div>
                        <div className='tel'><a href='tel:02-2633-3690'>T. 02-2633-3690</a></div>
                    </div>
                    <div className="footer-right">
                        <div className='foot_menu_nm'>menu</div>
                        <ul className="footer-menu">
                            <li><Link to="/">홈</Link></li>
                            <li><Link to="/academy">아카데미</Link></li>
                            <li><Link to="/brunches">지부소개</Link></li>
                            <li><Link to="/store">스토어</Link></li>
                            <li><Link to="/skill">기술</Link></li>
                            <li><Link to="/news">뉴스</Link></li>
                            <li><Link to="/qna">질문</Link></li>
                            <li><Link to="/sponsor">제휴업체</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <div className="footer-sns">
                        <a href="#Instagram"><img src="/images/icon-insta.png" alt="Instagram" /></a>
                        <a href="#facebook"><img src="/images/icon-facebook.png" alt="facebook" /></a>
                        <a href="#blog"><img src="/images/icon-blog.png" alt="blog" /></a>
                        <a href="#cafe"><img src="/images/icon-cafe.png" alt="cafe" /></a>
                    </div>
                    <div className='copyright'>©2006-{currentYear} BON JIU-JITSU. All rights reserved.</div>
                    <a className='gototop' href="#gototop"><img src='/images/icon-top-wt.png' alt='gototop'/></a>
                </div>
            </div>
        </footer>
    );
}

export default Footer; 