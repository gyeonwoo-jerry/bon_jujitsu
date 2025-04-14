import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../utils/api";
import "../styles/branchesDetail.css";
import BranchBoardList from "./BranchBoardList";
import NoticeBoardList from "./NoticeBoardList";

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
        <div className="branchDetail_header" style={{backgroundImage: `url(${branch.images[0]})`}}>
          <div className="branchInfo">
            <div className="ownerImage">
              <img src={branch.owner.userImages} alt="ownerImage" />
            </div>
            <div className="ownerInfo">
              <div className="branchName">본주짓수 / {branch.area} {branch.region}</div>
              <div className="ownerName">{branch.owner.name} 관장</div>
              <div className={`ownerBelt ${branch.owner.stripe}`}>
                {branch.owner.stripe} BELT / {branch.owner.level} GRAU
                <div className="grau">
                  {Array.from({ length: branch.owner.level }, (_, index) => (
                    <div key={index} className="grauLine"></div>
                  ))}
                </div>
              </div>
              <div className="branchAddress">{branch.address}</div>
              <div className="branchPhone">T. {branch.owner.phoneNum}</div>
              <div className="branchSns">
                  <ul>  
                    {branch.owner.sns1 && (
                      <a href={branch.owner.sns1} target="_blank" rel="noopener noreferrer">
                        <img src="/images/insta.png" alt="sns1" />
                      </a>
                    )}
                      {branch.owner.sns2 && (
                        <a href={branch.owner.sns2} target="_blank" rel="noopener noreferrer">
                          <img src="/images/fb.png" alt="sns2" /> 
                        </a>
                    )}
                    {branch.owner.sns3 && (
                      <a href={branch.owner.sns3} target="_blank" rel="noopener noreferrer">
                        <img src="/images/blog.png" alt="sns3" />
                      </a>
                    )}
                    {branch.owner.sns4 && (
                      <a href={branch.owner.sns4} target="_blank" rel="noopener noreferrer">
                        <img src="/images/cafe.png" alt="sns4" />
                      </a>
                    )}
                  </ul>
              </div>
            </div>
            
          </div>
        </div>
        <div className="branchDetail_content">
          {branch.content && (
                <>
          <div className="branchDetail_content_inner">
            <div className="branch_title">
              <div className="stit">지부</div>
              <div className="btit">BRANCH</div>
            </div>
            <div className="contents">
              <div className="branchDetail_content_title">
                <div className="stit">{branch.area}</div>
                <div className="btit">본주짓수아카데미 {branch.region}</div>
                
                    <div className="divider"></div>
                    <p>{branch.content}</p>
                  
              </div>
              <div className="branchDetail_content_text">
                <div className="slide_images">
                  {branch.images.map((image, index) => (
                    <div className="slide_image" key={index}>
                      <img src={image} alt={`slide_image_${index}`} />
                    </div>
                  ))}
                </div>
              </div> 
            </div>
             
          </div>
          </>
          )}
        </div>
        {branch.coaches.length > 0 && (
            <>
        <div className="coaches">
          <div className="coaches_inner">
            <div className="coaches_title">
              <div className="stit">코치진</div>
              <div className="btit">COACHING STAFF</div>
            </div>
            <div className="coaches_list">
              <ul>
                {branch.coaches.map((coach, index) => (
                <li key={index}>
                  <div className="thumnail">
                    <img src='/images/002.png' alt={branch.coaches[index].name} />
                  </div>
                  <div className="coach_info">
                    <div className="coach_name">{branch.coaches[index].name}</div>
                    <div className="coach_belt">{branch.coaches[index].stripe} BELT / {branch.coaches[index].level} GRAU</div>
                  </div>
                  
                </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
          </>
        )}

        <div className="branch_container">
          <div className="branch_inner">
            <div className="branch_board_title">
              <div className="stit">지부 게시판</div>
              <div className="btit">BRANCH BOARD</div>
            </div>
            <div className="content">
              <div className="board_list">
                <BranchBoardList />
              </div>
              <div className="board_list">
                <NoticeBoardList />
              </div>
            </div>
              
          </div>
        </div>
      </div>
    </div>
  );
}

export default BranchesDetail;
