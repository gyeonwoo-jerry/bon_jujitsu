// branchList.js
import React, { useState, useEffect } from "react";
import API from "../utils/api";

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
        <div>
            <h1>Branch List</h1>
            <ul>
                {branches.map(branch => (
                    <li key={branch.id}>
                        <h2>{branch.region}</h2>
                        <p>{branch.address}</p>
                        
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default BranchList;