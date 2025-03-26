import React from 'react';
import '../styles/subHeader.css';

function SubHeader({ pageName, descName, backgroundImage }) {
    
    return (
        <header className="subHeader">
            <div className='subHeader_container' style={{ backgroundImage: `url(${backgroundImage})` }}>
                <img className='subHeader_background_img' src='/images/background_img.png' alt="background" />
                <div className='inner'>
                    <div className='subHeader_container_title'>
                        {pageName}
                    </div>
                    <div className='subHeader_line'></div>
                    <div className='subHeader_desc'>
                        {descName} 
                    </div>
                </div>
            </div>
        </header>
    );
}

export default SubHeader; 
