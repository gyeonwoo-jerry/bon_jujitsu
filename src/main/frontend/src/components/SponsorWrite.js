import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../utils/api";
import "../styles/boardWrite.css";

function SponsorWrite({ apiEndpoint = "/sponsor", title = "제휴업체 작성" }) {
  const { id } = useParams(); // 수정 모드일 경우 게시글 ID
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    images: [], 
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  // 컴포넌트 언마운트 시 isMounted 플래그 업데이트
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 사용자 권한 확인
  useEffect(() => {
    const checkUserAuth = () => {
      try {
        const userInfoStr = localStorage.getItem('userInfo');
        const token = localStorage.getItem('token');
        
        if (!userInfoStr || !token) {
          setError('로그인이 필요합니다.');
          setAuthLoading(false);
          return;
        }

        const user = JSON.parse(userInfoStr);
        setUserInfo(user);
        
        // ADMIN 권한 체크
        if (user.role === 'ADMIN') {
          setIsAdmin(true);
        } else {
          setError('관리자 권한이 필요합니다.');
        }
      } catch (error) {
        console.error('사용자 정보 확인 오류:', error);
        setError('사용자 정보를 확인할 수 없습니다.');
      } finally {
        setAuthLoading(false);
      }
    };

    checkUserAuth();
  }, []);

  // 에러가 있을 때 alert 표시
  React.useEffect(() => {
    if (error) {
      alert(error);
      // 에러 메시지 표시 후 error 상태 초기화
      setError(null);
      // 권한이 없거나 로그인이 필요한 경우 이전 페이지로 이동
      if (error.includes('로그인') || error.includes('권한')) {
        navigate(-1);
      }
    }
  }, [error, navigate]);

  // fetchPostData 함수를 useCallback으로 메모이제이션
  const fetchPostData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get(`${apiEndpoint}/${id}`);
      // 컴포넌트가 마운트된 상태인지 확인
      if (!isMounted.current) return;

      if (response.status === 200) {
        const postData = response.data.content;
        setFormData({
          title: postData.title || "",
          content: postData.content || "",
          images: postData.images || [],
        });
        // 기존 이미지 미리보기 설정
        setPreviewImages(postData.images || []);
      }
    } catch (error) {
      if (isMounted.current) {
        console.error("게시글 데이터 불러오기 실패:", error);
        setError("게시글 데이터를 불러오는 중 오류가 발생했습니다.");
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [apiEndpoint, id]);

  useEffect(() => {
    document.title = id ? "게시글 수정" : title;

    // 수정 모드인 경우 기존 게시글 데이터 불러오기
    if (id) {
      setIsEditMode(true);
      fetchPostData();
    }
  }, [id, title, fetchPostData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);

    // 이미지 미리보기 생성
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (isMounted.current) {
          setPreviewImages((prev) => [...prev, event.target.result]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

    // 수정 모드에서 기존 이미지 삭제 처리
    if (isEditMode) {
      setFormData((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      // 기본 유효성 검사
      if (!formData.title.trim()) {
        setError("제목을 입력해주세요.");
        setLoading(false);
        return;
      }

      if (!formData.content.trim()) {
        setError("내용을 입력해주세요.");
        setLoading(false);
        return;
      }

      let response;

      // 뉴스 API는 다른 형식으로 데이터 전송
      if (apiEndpoint === "/sponsor") {
        const sponsorFormData = new FormData();

        // JSON 데이터를 Blob으로 변환하여 추가
        const jsonBlob = new Blob(
          [
            JSON.stringify({
              title: formData.title,
              content: formData.content,
            }),
          ],
          { type: "application/json" }
        );

        if (isEditMode) {
          // 수정 모드에서는 "update" 키 사용
          sponsorFormData.append("update", jsonBlob);
        } else {
          // 생성 모드에서는 "request" 키 사용
          sponsorFormData.append("request", jsonBlob);
        }

        // 선택한 파일이 있는 경우 FormData에 추가
        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file) => {
            sponsorFormData.append("images", file); // 'images' 키로 파일 추가
          });
        }

        console.log("제휴업체 등록 요청 데이터:", sponsorFormData);

        if (isEditMode) {
          // 수정 모드: PATCH 메서드 사용
          response = await API.patch(`${apiEndpoint}/${id}`, sponsorFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        } else {
          // 생성 모드: POST 메서드 사용
          response = await API.post(`${apiEndpoint}`, sponsorFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }
      } else {
        // 일반 게시글 등록/수정 로직
        const sponsorFormData = new FormData();

        // JSON 데이터를 Blob으로 변환하여 추가
        const jsonBlob = new Blob(
          [
            JSON.stringify({
              title: formData.title,
              content: formData.content,
            }),
          ],
          { type: "application/json" }
        );
        sponsorFormData.append("request", jsonBlob);
        // 선택한 파일이 있는 경우 FormData에 추가
        if (selectedFiles.length > 0) {
          selectedFiles.forEach((file) => {
            sponsorFormData.append("images", file); // 'images' 키로 파일 추가
          });
        }

        if (isEditMode) {
          response = await API.put(`${apiEndpoint}/${id}`, sponsorFormData, {
            headers: {
              "Content-Type": "multipart/form-data",
            }
        });
        } else {
            response = await API.post(apiEndpoint, sponsorFormData, {
                headers: {
                "Content-Type": "multipart/form-data",
                }
            });
        }
      }
      if (response.status === 200 || response.status === 201) {
        if (response.data.success) {
          // 성공 시 게시글 목록 또는 상세 페이지로 이동
          if (apiEndpoint === "/sponsor") {
            // 제휴업체 목록으로 이동
            navigate(apiEndpoint);
          } else {
            // ID가 있으면 해당 게시글의 상세 페이지로, 없으면 목록으로 이동
            const redirectId = isEditMode ? id : response.data.id;
            if (redirectId) {
              // 수정 모드일 경우 해당 게시글의 상세 페이지로 이동
              navigate(
                `${
                  apiEndpoint.startsWith("/") ? apiEndpoint : "/" + apiEndpoint
                }/${redirectId}`
              );
            } else {
              // 등록 모드일 경우 게시글 목록으로 이동
              navigate(apiEndpoint);
            }
          }
        } else {
          if (response.data.message) {
            setError(response.data.message);
          } else {
            setError("글 등록에 실패했습니다.");
          }
        }
      }
    } catch (error) {
      if (isMounted.current) {
        if (
          error.response &&
          error.response.data &&
          error.response.data.message
        ) {
          setError(error.response.data.message);
        } else {
          setError("게시글을 저장하는 중 오류가 발생했습니다.");
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?"
      )
    ) {
      navigate(-1); // 이전 페이지로 이동
    }
  };

  if (authLoading) {
    return <div className="loading">권한을 확인하는 중...</div>;
  }

  if (!isAdmin) {
    return <div className="error-message">접근 권한이 없습니다.</div>;
  }

  if (loading && isEditMode) {
    return <div className="loading">게시글 정보를 불러오는 중...</div>;
  }

  return (
    <div className="board-write-container">
      <h1 className="board-write-title">
        {isEditMode ? "게시글 수정" : title}
      </h1>

      {error && <div className="error-message">{error}</div>}

      <form className="board-write-form" onSubmit={handleSubmit}>

        <div className="form-group">
          <label htmlFor="title">제목</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="제목을 입력하세요"
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="내용을 입력하세요"
            rows="10"
          ></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="images">이미지 첨부</label>
          <input
            type="file"
            id="images"
            name="images"
            onChange={handleFileChange}
            multiple
            accept="image/*"
          />
          <div className="image-preview-container">
            {previewImages.map((src, index) => (
              <div className="image-preview" key={index}>
                <img src={src} alt={`미리보기 ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={handleCancel}
          >
            취소
          </button>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? "저장 중..." : isEditMode ? "수정하기" : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SponsorWrite;
