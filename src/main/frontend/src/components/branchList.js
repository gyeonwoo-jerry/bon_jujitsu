// branchList.js
import React, { useEffect, useState } from "react";
import API from "../utils/api";
import '../styles/branchList.css';

function BranchList() {
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        // API를 통해 모든 branch 데이터를 가져옵니다.
        API.get('/branch/all?page=1&size=10')
            .then(response => {
                if (response.status === 200) {
                    setBranches(response.data.data); // 데이터 배열을 상태로 설정합니다.
                }
            })
            .catch(error => {
                console.error('Error fetching branch data:', error);
            });
    }, []);

    return (
        <div className="branchList_container">
            <div className="inner">
              
              
                <h1>Branch List</h1>
                <ul>
                    {branches.map(branch => (
                        <li className='branch_item'  key={branch.id}>
                            <div className='branch_item_title'>
                                <div className='branch_item_title_tit'>{branch.region}</div>
                                <button className='branch_item_title_more'>
                                    <img src='/images/icon_click_wt.png' alt='더보기' />
                                </button>
                            </div>
                            <div className='branch_info'>
                                <div className='address'><font className='accent'>A.</font>{branch.address}</div>
                                <div className='phone'><font className='accent'>T.</font>010.1234.1234</div>
                                <div className='sns'>
                                    <ul>
                                        <li>
                                            <a target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-facebook.png' alt='페이스북' />
                                            </a>
                                        </li>
                                        <li>
                                            <a target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-insta.png' alt='인스타그램' />
                                            </a>
                                        </li>
                                        <li>
                                            <a target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-blog.png' alt='블로그' />
                                            </a>
                                        </li>
                                        <li>
                                            <a target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-cafe.png' alt='카페' />
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default BranchList;