import React from 'react';
import '../styles/subHeader.css';

function SubHeader({ pageName }) {

    return (
        <header className="subHeader">
            <div className='subHeader_container'>
                <div className='inner'>
                    <div className='subHeader_container_title'>
                        {pageName}
                    </div>
                    <div className='subHeader_line'></div>
                    <div className='subHeader_desc'>
                        본주짓수는 다양한 지역에서 활동하고 있습니다.
                    </div>
                </div>
            </div>
        </header>
    );
}

export default SubHeader; 
