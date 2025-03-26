import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/tabMenu.css';

function TabMenu() {
    const [activeTab, setActiveTab] = useState('');
    const location = useLocation();
    const currentPath = location.pathname;
    
    // URL 경로가 변경될 때마다 activeTab 업데이트
    useEffect(() => {
        // 경로에서 첫 번째 '/' 뒤의 문자열 추출
        const path = currentPath.split('/')[1] || 'academy'; // 기본값 'academy'
        setActiveTab(path);
    }, [currentPath]);

    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    return (
        <div className='tabMenu'>
            <ul className='tabMenu_list'>
                <li className={`tabMenu_item ${activeTab === 'academy' ? 'active' : ''}`} onClick={() => handleTabClick('academy')}>
                    <Link to='/academy'>아카데미 소개</Link>
                </li>
                <li className={`tabMenu_item ${activeTab === 'introJiujitsu' ? 'active' : ''}`} onClick={() => handleTabClick('introJiujitsu')}>
                    <Link to='/introJiujitsu'>브라질리언 주짓수란?</Link>
                </li>
                <li className={`tabMenu_item ${activeTab === 'introGreeting' ? 'active' : ''}`} onClick={() => handleTabClick('introGreeting')}>
                    <Link to='/introGreeting'>대표 인삿말</Link>
                </li>
                <li className={`tabMenu_item ${activeTab === 'introLevel' ? 'active' : ''}`} onClick={() => handleTabClick('introLevel')}>
                    <Link to='/introLevel'>승급 시스템 안내</Link>
                </li>  
            </ul>  
        </div>
    );
}

export default TabMenu;

