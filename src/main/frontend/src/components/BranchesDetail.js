import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/api";

function BranchesDetail() {
  const { id } = useParams(); // URL에서 id 파라미터를 가져옵니다.
  const [branch, setBranch] = useState(null);

  useEffect(() => {
    // API를 통해 특정 branch 데이터를 가져옵니다.
    API.get(`/branch/${id}`)
      .then((response) => {
        if (response.status === 200) {
          if (response.data.success) {
            setBranch(response.data.content);
          } else {
            throw new Error("브랜치 상세 정보를 불러오는데 실패했습니다.");
          }
        }
      })
      .catch((error) => {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          alert(error.response.data.message);
        } else {
          alert("브랜치 상세 정보를 불러오는데 중 오류가 발생했습니다.");
        }
      });
  }, [id]);

  if (!branch) {
    return <div>Loading...</div>;
  }

  return (
    <div className="branchDetail_container">
      <div className="inner">
        <h2>{branch.region}</h2>
        <p>Address: {branch.address}</p>
        <p>Area: {branch.area}</p>
        {branch.owner && (
          <div>
            <h3>Owner Information</h3>
            <p>Name: {branch.owner.name}</p>
            <p>Email: {branch.owner.email}</p>
            <p>Phone: {branch.owner.phoneNum}</p>
            <p>Address: {branch.owner.address}</p>
            <p>Level: {branch.owner.level}</p>
            <p>Stripe: {branch.owner.stripe}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchesDetail;
