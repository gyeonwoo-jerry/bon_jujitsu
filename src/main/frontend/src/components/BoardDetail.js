import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../utils/api";
import "../styles/boardDetail.css";

function BoardDetail({ apiEndpoint = "/board" }) {
  const { id } = useParams(); // URL에서 게시글 ID를 가져옵니다.
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // API 엔드포인트 정규화
  const normalizedApiEndpoint = apiEndpoint.startsWith("/")
    ? apiEndpoint
    : `/${apiEndpoint}`;

  // 이미지 URL 정규화 함수
  const normalizeImageUrl = (url) => {
    if (!url) return "/images/blank_img.png";

    // 이미 절대 URL인 경우 그대로 반환
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // 상대 URL인 경우 경로 정리
    if (url.includes("%")) {
      try {
        return decodeURIComponent(url);
      } catch (e) {
        console.error("URL 디코딩 오류:", e);
      }
    }

    // 슬래시로 시작하는지 확인하고 조정
    return url.startsWith("/") ? url : `/${url}`;
  };

  // fetchPostDetail 함수를 useCallback으로 메모이제이션
  const fetchPostDetail = useCallback(async () => {
    // ID가 유효한지 확인
    if (!id || id === "undefined") {
      setError("유효하지 않은 게시글 ID입니다.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log(`게시물 상세 정보 요청: ${normalizedApiEndpoint}/${id}`);
      const response = await API.get(`${normalizedApiEndpoint}/${id}`);

      if (response.status === 200) {
        console.log("Post detail fetched:", response.data);
        if (response.data.success) {
          setPost(response.data.data);
          document.title = response.data.data?.title || "게시글 상세";
        } else {
          throw new Error("게시글을 불러오는데 실패했습니다.");
        }
      } else {
        throw new Error("게시글을 불러오는데 실패했습니다.");
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("게시글을 불러오는데 중 오류가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [normalizedApiEndpoint, id]);

  useEffect(() => {
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
      <div className="board-detail-header">
        <button className="back-button" onClick={handleGoBack}>
          &larr; 목록으로
        </button>

        <button className="delete-button" onClick={handleDelete}>
          삭제
        </button>
      </div>

      <div className="post-detail-header">
        <h1 className="post-detail-title">{post.title || "제목 없음"}</h1>
        <div className="post-detail-meta">
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
          <div className="post-detail-images">
            {post.images.map((image, index) => (
              <div key={index} className="post-detail-image-container">
                <img
                  src={normalizeImageUrl(image)}
                  alt={`${post.title || "게시글"} 이미지 ${index + 1}`}
                  className="post-detail-image"
                  onError={(e) => {
                    console.log("이미지 로딩 오류, 기본 이미지로 대체:", image);
                    e.target.src = "/images/blank_img.png";
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BoardDetail;
