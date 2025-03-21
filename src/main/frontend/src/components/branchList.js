// branchList.js
import React, { useState, useEffect } from "react";
import API from "../utils/api";

function BranchList() {
    const [branches, setBranches] = useState([]);

    useEffect(() => {
        // API를 통해 모든 branch 데이터를 가져옵니다.
        API.post('/branch/all')
            .then(response => {
                setBranches(response.data);
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
                    <li key={branch.id}>{branch.name}</li>
                ))}
            </ul>
        </div>
    );
}

export default BranchList;