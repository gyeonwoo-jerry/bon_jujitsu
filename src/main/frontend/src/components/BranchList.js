import React, { useEffect, useState } from 'react';

function BranchList() {
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/branches')
      .then(response => response.json())
      .then(data => setBranches(data))
      .catch(error => console.error('Error fetching branches:', error));
  }, []);

  return (
    <div className="branch_latest">
      <ul>
        {branches.map((branch, index) => (
          <li key={index}>
            <div className='name'>{branch.region}</div>
            <div className='address'>{branch.address}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default BranchList; 