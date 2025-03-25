import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import API from "../utils/api";
import '../styles/branchList.css';

function BranchList() {
    const [branches, setBranches] = useState([]);
    const [filteredBranches, setFilteredBranches] = useState([]);
    const [activeArea, setActiveArea] = useState('전체'); // 기본값을 '전체'로 설정
    const navigate = useNavigate(); // useNavigate 훅을 사용하여 네비게이션 기능을 가져옵니다.


    useEffect(() => {
        // API를 통해 모든 branch 데이터를 가져옵니다.
        API.get('/branch/all?page=1&size=10')
            .then(response => {
                if (response.status === 200) {
                    setBranches(response.data.data);
                }
            })
            .catch(error => {
                console.error('Error fetching branch data:', error);
            });
    }, []);
    

    const handleMoreClick = (id) => {
        navigate(`/branches/${id}`); // 해당 지부의 ID로 이동합니다.
    };

    const handleTabClick = (area) => {
        setActiveArea(area);
        if (area === '전체') {
            setFilteredBranches(branches);
        } else {
            setFilteredBranches(branches.filter(branch => branch.area === area));
        }
    };

    // branches가 로드된 후에만 uniqueAreas를 계산합니다.
    const uniqueAreas = branches.length > 0 ? ['전체', ...new Set(branches.map(branch => branch.area))] : ['전체'];

    return (
        <div className="branchList_container">
            <div className="inner">
                            
                <div className="section_title">본주짓수 전국 지부 소개</div>

                <div className="tabs">
                    {uniqueAreas.map(area => (
                        <button
                            key={area}
                            className={`tab ${activeArea === area ? 'active' : ''}`}
                            onClick={() => handleTabClick(area)}
                        >
                            {area}
                        </button>
                    ))}
                </div>

                <ul>
                    {filteredBranches.map(branch => (

                        <li className='branch_item'  key={branch.id}>
                            <div className='branch_item_title'>
                                <div className='branch_item_title_tit'>
                                    <div className='gym_name'>{branch.region}</div>
                                    <div className='gym_area'>{branch.area}</div>
                                </div>
                                <button className='branch_item_title_more'  onClick={() => handleMoreClick(branch.id)}>
                                    <img src='/images/icon_click_wt.png' alt='더보기' />
                                </button>
                            </div>
                            <div className='branch_info'>
                                <div className='owner_name'><font className='accent'>Prof.</font>{branch.owner.name}</div>
                                <div className='address'><font className='accent'>A.</font>{branch.address}</div>
                                <div className='phone'><font className='accent'>T.</font>{branch.owner.phoneNum}</div>
                                <div className='sns'>
                                    <ul>
                                        <li className={`${branch.owner.sns1 ? '' : 'display_none'}`}>
                                            <a href={branch.owner.sns1} target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-facebook.png' alt='페이스북' />
                                            </a>
                                        </li>
                                        <li className={`${branch.owner.sns2 ? '' : 'display_none'}`}>
                                            <a href={branch.owner.sns2} target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-insta.png' alt='인스타그램' />
                                            </a>
                                        </li>
                                        <li className={`${branch.owner.sns3 ? '' : 'display_none'}`}>
                                            <a href={branch.owner.sns3} target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-blog.png' alt='블로그' />
                                            </a>
                                        </li>
                                        <li className={`${branch.owner.sns4 ? '' : 'display_none'}`}>
                                            <a href={branch.owner.sns4} target='_blank' rel='noopener noreferrer'>
                                                <img src='/images/icon-cafe.png' alt='카페' />
                                            </a>
                                        </li>

                                        <li className={`${branch.owner.sns5 ? '' : 'display_none'}`}>
                                            <a href={branch.owner.sns5} target='_blank' rel='noopener noreferrer'>
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