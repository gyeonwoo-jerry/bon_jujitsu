import React from 'react';

function GoToTopButton() {
    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // 부드럽게 스크롤
        });
    };

    return (
        <button className='gototop' id="gototop" onClick={scrollToTop} style={buttonStyle}>
            <img src='/images/icon-top-wt.png' alt='gototop'/>
        </button>
    );
}

const buttonStyle = {
    position: 'relative',
    cursor: 'pointer',
};

export default GoToTopButton; 