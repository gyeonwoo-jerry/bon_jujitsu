import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import API from "../utils/api";
import "../styles/branchesDetail.css";
import BranchBoardList from "./BranchBoardList";
import NoticeBoardList from "./NoticeBoardList";
import ColorThief from 'colorthief';

function BranchesDetail() {
  const { id } = useParams(); // URL에서 id 파라미터를 가져옵니다.
  const [branch, setBranch] = useState(null);
  const [textColor, setTextColor] = useState('#1f1f1f');
  const [colorClass, setColorClass] = useState('black');

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

  useEffect(() => {
    if (branch && branch.images && branch.images.length > 0) {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.src = branch.images[0].url;

      img.onload = () => {
        const colorThief = new ColorThief();
        const dominantColor = colorThief.getColor(img);
        // 밝은 색상이면 어두운 텍스트, 어두운 색상이면 밝은 텍스트 사용
        const brightness = (dominantColor[0] * 299 + dominantColor[1] * 587 + dominantColor[2] * 114) / 1000;
        setTextColor(brightness > 128 ? '#1f1f1f' : '#FFFFFF');
        setColorClass(brightness > 128 ? 'black' : 'white');
      };
    }
  }, [branch]);

  // 슬라이더 설정
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    arrows: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: false,
        }
      }
    ]
  };

  if (!branch) {
    return <div>Loading...</div>;
  }

  return (
    <div className="branchDetail_container">
      <div className="inner">
        <div className="branchDetail_header" style={{backgroundImage: `url(${branch.images[0].url})`}}>
          <div className="branchInfo">
            <div className="ownerImage">
              <img src={branch.owner.userImages} alt="ownerImage" />
            </div>
            <div className="ownerInfo">
              <div className="branchName">본주짓수 / {branch.area} {branch.region}</div>
              <div className={`ownerName ${colorClass}`} style={{ color: textColor }}>{branch.owner.name} 관장</div>
              <div className={`ownerBelt ${branch.owner.stripe}`}>
                {branch.owner.stripe} BELT / {branch.owner.level} GRAU
                <div className="grau">
                  {Array.from({ length: branch.owner.level }, (_, index) => (
                    <div key={index} className="grauLine"></div>
                  ))}
                </div>
              </div>
              <div className={`branchAddress ${colorClass}`} style={{ color: textColor }}>{branch.address}</div>
              <div className={`branchPhone ${colorClass}`} style={{ color: textColor }}>T. {branch.owner.phoneNum}</div>
              <div className="branchSns">
                   <ul>  
                     {branch.owner.sns1 && (
                       <a href={branch.owner.sns1} target="_blank" rel="noopener noreferrer">
                         <img className={colorClass} src={colorClass === 'white' ? "/images/icon-facebook-wt.png" : "/images/icon-facebook-bk.png"} alt="sns1" />
                       </a>
                     )}
                     {branch.owner.sns2 && (
                       <a href={branch.owner.sns2} target="_blank" rel="noopener noreferrer">
                         <img className={colorClass} src={colorClass === 'white' ? "/images/icon-insta-wt.png" : "/images/icon-insta-bk.png"} alt="sns2" /> 
                       </a>
                     )}
                     {branch.owner.sns3 && (
                       <a href={branch.owner.sns3} target="_blank" rel="noopener noreferrer">
                         <img className={colorClass} src={colorClass === 'white' ? "/images/icon-blog-wt.png" : "/images/icon-blog-bk.png"} alt="sns3" />
                       </a>
                     )}
                     {branch.owner.sns4 && (
                       <a href={branch.owner.sns4} target="_blank" rel="noopener noreferrer">
                         <img className={colorClass} src={colorClass === 'white' ? "/images/icon-cafe-wt.png" : "/images/icon-cafe-bk.png"} alt="sns4" />
                       </a>
                     )}
                     {branch.owner.sns5 && (
                       <a href={branch.owner.sns5} target="_blank" rel="noopener noreferrer">
                         <img className={colorClass} src={colorClass === 'white' ? "/images/icon-you-wt.png" : "/images/icon-you-bk.png"} alt="sns5" />
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
                <div className="content">{branch.content}</div>
              </div>
              <div className="branchDetail_content_text">
                <div className="slide_images_container">
                  {branch.images && branch.images.length > 0 ? (
                    branch.images.length === 1 ? (
                      // 이미지가 1장인 경우 단일 이미지로 표시
                      <div className="slide_image">
                        
                        <img src={branch.images[0].url} alt="지점 이미지" />
                      </div>
                    ) : (
                      // 이미지가 2장 이상인 경우 슬라이더로 표시
                      <Slider {...sliderSettings} className="image-slider">
                        
                        {branch.images.map((image, index) => (
                          <div className="slide_image" key={index}>
                            <img src={image.url} alt={`지점 이미지 ${index + 1}`} />
                          </div>
                        ))}
                      </Slider>
                    )
                  ) : (
                    // 이미지가 없는 경우 기본 이미지 표시
                    <div className="slide_image no-image">
                      <img src="/images/default-wt.png" alt="이미지 없음" />
                    </div>
                  )}
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
                    <img src={branch.coaches[index].userImages || '/images/default-wt.png'} alt={branch.coaches[index].name} />
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
