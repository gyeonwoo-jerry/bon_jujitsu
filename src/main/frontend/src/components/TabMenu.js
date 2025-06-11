import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/tabMenu.css';

function TabMenu({ activeTab, onTabClick }) {
    const location = useLocation();
    const currentPath = location.pathname;

    // URL 경로가 변경될 때마다 activeTab 업데이트 (필요시)
    useEffect(() => {
        // 기본적으로는 부모에서 전달받은 activeTab을 사용
        // 하지만 URL이 변경되었을 때도 대응할 수 있도록 함
        if (currentPath === '/academy' && onTabClick) {
            // 아카데미 페이지에 처음 접근했을 때만 기본 탭 설정
        }
    }, [currentPath, onTabClick]);

    const handleTabClick = (tab) => {
        if (onTabClick) {
            onTabClick(tab);
        }
    };

    return (
        <div className='tabMenu'>
            <ul className='tabMenu_list'>
                <li className={`tabMenu_item ${activeTab === 'academy' ? 'active' : ''}`} onClick={() => handleTabClick('academy')}>
                    아카데미 소개
                </li>
                <li className={`tabMenu_item ${activeTab === 'introJiujitsu' ? 'active' : ''}`} onClick={() => handleTabClick('introJiujitsu')}>
                    브라질리언 주짓수란?
                </li>
                <li className={`tabMenu_item ${activeTab === 'introGreeting' ? 'active' : ''}`} onClick={() => handleTabClick('introGreeting')}>
                    대표 인삿말
                </li>
                <li className={`tabMenu_item ${activeTab === 'introLevel' ? 'active' : ''}`} onClick={() => handleTabClick('introLevel')}>
                    승급 시스템 안내
                </li>
            </ul>
        </div>
    );
}

export default TabMenu;