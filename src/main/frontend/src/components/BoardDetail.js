import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/boardDetail.css";

function BoardDetail({ apiEndpoint = "/board", onPostLoad }) {
  const { id } = useParams(); // URL에서 게시글 ID를 가져옵니다.
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // API 엔드포인트 정규화
  const normalizedApiEndpoint = apiEndpoint.startsWith("/")
    ? apiEndpoint
    : `/${apiEndpoint}`;

  // 이미지 URL 정규화 함수
  const normalizeImageUrl = (imageData) => {
    console.log("normalizeImageUrl - 입력:", imageData);
    
    // 빈 값이면 기본 이미지 반환
    if (!imageData) {
      console.log("normalizeImageUrl - 빈 값, 기본 이미지 반환");
      return "/images/blank_img.png";
    }

    let url = imageData;
    
    // 객체인 경우 URL 추출
    if (typeof imageData === 'object') {
      url = imageData.url || imageData.imagePath || imageData.src;
      console.log("normalizeImageUrl - 객체에서 URL 추출:", url);
    }
    
    // URL이 여전히 문자열이 아니면 기본 이미지 반환
    if (!url || typeof url !== 'string') {
      console.log("normalizeImageUrl - 유효하지 않은 URL, 기본 이미지 반환");
      return "/images/blank_img.png";
    }

    // 이미 절대 URL인 경우 그대로 반환
    if (url.startsWith("http://") || url.startsWith("https://")) {
      console.log("normalizeImageUrl - 절대 URL:", url);
      return url;
    }

    // 상대 URL인 경우 경로 정리
    if (url.includes("%")) {
      try {
        const decodedUrl = decodeURIComponent(url);
        console.log("normalizeImageUrl - 디코딩된 URL:", decodedUrl);
        return decodedUrl;
      } catch (e) {
        console.error("URL 디코딩 오류:", e);
      }
    }

    // 슬래시로 시작하는지 확인하고 조정
    const finalUrl = url.startsWith("/") ? url : `/${url}`;
    console.log("normalizeImageUrl - 최종 URL:", finalUrl);
    return finalUrl;
  };

  // fetchPostDetail 함수를 useCallback으로 메모이제이션
  const fetchPostDetail = useCallback(async () => {
    // ID가 유효한지 확인
    if (!id || id === "undefined" || id === undefined || id === null) {
      setError("유효하지 않은 게시글 ID입니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`게시물 상세 정보 요청: ${normalizedApiEndpoint}/${id}`);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const response = await API.get(`${normalizedApiEndpoint}/${id}`, { headers });

      if (response.status === 200) {
        console.log("Post detail fetched:", response.data);
        if (response.data.success) {
          const postData = response.data.content;
          setPost(postData);
          document.title = postData?.title || "게시글 상세";
          
          // 게시글 제목을 부모 컴포넌트로 전달
          if (onPostLoad && postData.title) {
            onPostLoad(postData.title);
          }
        } else {
          throw new Error(response.data.message || "게시글을 불러오는데 실패했습니다.");
        }
      } else {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      console.error("게시글 로딩 오류:", err);
      let errorMessage = "게시글을 불러오는 중 오류가 발생했습니다.";
      
      if (err.response) {
        if (err.response.status === 500) {
          errorMessage = "서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
        } else if (err.response.status === 404) {
          errorMessage = "게시글을 찾을 수 없습니다.";
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `서버 오류 (${err.response.status}): ${errorMessage}`;
        }
      } else if (err.request) {
        errorMessage = "네트워크 연결을 확인해주세요.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [normalizedApiEndpoint, id, onPostLoad]);

  useEffect(() => {
    const checkUserRole = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
          const userInfo = JSON.parse(userInfoStr);
          setIsAdmin(userInfo.role === 'ADMIN');
        }
      } catch (error) {
        console.error('사용자 권한 확인 오류:', error);
        setIsAdmin(false);
      }
    };
    checkUserRole();

    // 게시글 ID가 있을 때만 API를 호출합니다.
    if (id && id !== "undefined") {
      fetchPostDetail();
    } else {
      setError("유효하지 않은 게시글 ID입니다.");
      setLoading(false);
    }
  }, [id, fetchPostDetail]);

  const handleGoBack = () => {
    navigate(-1); // 이전 페이지로 이동
  };

  // 게시물 수정 함수
  const handleEdit = () => {
    // ID 유효성 확인 및 디버깅 로그
    console.log("BoardDetail - handleEdit ID:", id);
    console.log("BoardDetail - apiEndpoint:", normalizedApiEndpoint);
    
    if (!id || id === "undefined") {
      alert("유효하지 않은 게시글입니다.");
      return;
    }

    // API 엔드포인트에 따라 수정 페이지 경로 결정
    let editPath = "";
    
    if (normalizedApiEndpoint.includes("/skill")) {
      editPath = `/skillWrite/${id}`;
    } else if (normalizedApiEndpoint.includes("/news")) {
      editPath = `/newsWrite/${id}`;
    } else if (normalizedApiEndpoint.includes("/qna")) {
      editPath = `/qnaWrite/${id}`;
    } else if (normalizedApiEndpoint.includes("/sponsor")) {
      editPath = `/sponsorWrite/${id}`;
    } else {
      // 기본 게시판
      editPath = `/boardWrite/${id}`;
    }

    console.log("BoardDetail - editPath:", editPath);
    navigate(editPath);
  };

  // 게시물 삭제 함수
  const handleDelete = async () => {
    // ID 유효성 확인
    if (!id || id === "undefined") {
      alert("유효하지 않은 게시글입니다.");
      return;
    }

    // 사용자 확인
    if (!window.confirm("정말로 이 게시물을 삭제하시겠습니까?")) {
      return;
    }

    try {
      // localStorage에서 userId 가져오기
      const userId = localStorage.getItem("userId") || 1;

      // API 엔드포인트 경로 처리
      // '/board' -> '' (비움), '/news' -> '/news' 유지
      const deleteEndpoint = normalizedApiEndpoint.includes("/board")
        ? normalizedApiEndpoint.replace("/board", "")
        : normalizedApiEndpoint;

      // 빈 문자열 체크하여 기본값 설정
      const finalEndpoint = deleteEndpoint || "";

      console.log(`삭제 API 호출: ${finalEndpoint}/${id}?id=${userId}`);

      // 삭제 API 호출
      const response = await API.delete(`${finalEndpoint}/${id}?id=${userId}`);

      console.log("삭제 응답:", response);

      if (response.status === 200) {
        alert("게시물이 성공적으로 삭제되었습니다.");
        // 목록 페이지로 이동
        navigate(-1);
      } else {
        throw new Error(
          `삭제 요청이 실패했습니다. 상태 코드: ${response.status}`
        );
      }
    } catch (err) {
      console.error("게시물 삭제 중 오류 발생:", err);
      alert(
        "게시물 삭제 중 오류가 발생했습니다: " +
          (err.message || "알 수 없는 오류")
      );
    }
  };

  // 로딩 중인 경우
  if (loading) {
    return <div className="loading">게시글을 불러오는 중...</div>;
  }

  // 오류가 발생한 경우
  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">{error}</p>
        <button className="back-button" onClick={handleGoBack}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // 게시글이 없는 경우
  if (!post) {
    return (
      <div className="error-container">
        <p className="error-message">게시글을 찾을 수 없습니다.</p>
        <button className="back-button" onClick={handleGoBack}>
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="board-detail-container">
      <div className="inner">
        <div className="detail_header">
          <button className="back-button" onClick={handleGoBack}>
            &larr;
          </button>
          {isAdmin && (
            <div className="admin-buttons">
              <button className="edit-button" onClick={handleEdit}>
                수정
              </button>
              <button className="delete-button" onClick={handleDelete}>
                삭제
              </button>
            </div>
          )}
        </div>

        <div className="detail_content">
          <h1 className="title">{post.title || "제목 없음"}</h1>
          <div className="meta_data">
            {post.region && (
              <span className="post-detail-region">{post.region}</span>
            )}
            <span className="post-detail-author">
              {post.name || "작성자 없음"}
            </span>
            <span className="post-detail-date">
              {post.createdAt
                ? new Date(post.createdAt).toLocaleDateString()
                : "날짜 정보 없음"}
            </span>
          </div>
          <div className="post-detail-content">
            {post.content && (
              <div className="post-detail-text">
                {post.content.split("\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}

            {Array.isArray(post.images) && post.images.length > 0 && (
              <div className="post_detail_images">
                {post.images.map((image, index) => (
                  <div key={index} className="post_image">
                    <img
                      src={normalizeImageUrl(image)}
                      alt={`${post.title || "게시글"} 이미지 ${index + 1}`}
                      className="post-detail-image"
                      onError={(e) => {
                        console.log("이미지 로딩 오류, 기본 이미지로 대체:", image);
                        console.log("원본 src:", e.target.src);
                        e.target.src = "/images/blank_img.png";
                        e.target.onerror = null; // 무한 루프 방지
                      }}
                      onLoad={() => {
                        console.log("이미지 로드 성공:", normalizeImageUrl(image));
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        
      </div>
    </div>
  );
}

export default BoardDetail;
