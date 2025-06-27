import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";
import { loggedNavigate } from "../utils/navigationLogger";
import "../styles/boardWrite.css";

const PostWrite = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const safeNavigate = loggedNavigate(navigate);

  const [branchId, setBranchId] = useState(null);
  const [postType, setPostType] = useState(null); // 'board' 또는 'notice'
  const [formData, setFormData] = useState({
    title: "",
    content: ""
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const maxImages = 10;
  const maxImageSize = 10 * 1024 * 1024; // 10MB

  // URL에서 브랜치 ID와 게시물 타입 추출
  useEffect(() => {
    if (params.branchId && params.postType) {
      setBranchId(params.branchId);

      // postType 유효성 검증
      if (params.postType === 'board' || params.postType === 'notice') {
        setPostType(params.postType);
        console.log(`${params.postType} 글쓰기 - 브랜치 ID:`, params.branchId);
      } else {
        setError("잘못된 게시글 타입입니다. board 또는 notice만 가능합니다.");
      }
    } else {
      console.warn("URL에서 브랜치 ID 또는 게시글 타입을 찾을 수 없습니다");
      setError("잘못된 접근입니다. 올바른 지부 페이지에서 접근해주세요.");
    }
  }, [params]);

  // 권한 확인
  useEffect(() => {
    if (branchId && postType) {
      checkWritePermission();
    }
  }, [branchId, postType]);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  // 해당 지부 회원인지 확인 (일반 게시판용 - USER, COACH, OWNER 모두 가능)
  const isBranchMember = () => {
    console.log('=== 지부 회원 확인 시작 (Board) ===');

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    console.log('parsed userInfo:', userInfo);
    console.log('현재 branchId:', branchId);

    // 관리자는 모든 지부에 글쓰기 가능
    if (userInfo.isAdmin === true) {
      console.log('✅ 관리자 권한으로 허용');
      return true;
    }

    // 사용자의 지부 정보 확인 (USER, COACH, OWNER 모든 역할 허용, PENDING 제외)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      console.log('branchRoles 배열:', userInfo.branchRoles);

      const isMember = userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        console.log(`비교: ${userBranchId} (${typeof userBranchId}) === ${currentBranchId} (${typeof currentBranchId})`);
        console.log(`역할: ${role}`);
        console.log(`브랜치 일치: ${String(userBranchId) === String(currentBranchId)}`);

        // 해당 브랜치의 활성 역할(USER, COACH, OWNER) 허용, PENDING은 제외
        const isValidRole = ['USER', 'COACH', 'OWNER'].includes(role);
        const isSameBranch = String(userBranchId) === String(currentBranchId);

        console.log(`유효한 역할: ${isValidRole}, 같은 브랜치: ${isSameBranch}`);

        return isSameBranch && isValidRole;
      });

      console.log('✅ 최종 지부 회원 여부:', isMember);
      return isMember;
    } else {
      console.log('❌ branchRoles 정보 없음');
    }

    return false;
  };

  // 해당 지부의 Owner인지 확인 (공지사항용)
  const isBranchOwner = () => {
    console.log('=== 지부 Owner 확인 시작 (Notice) ===');

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    console.log('parsed userInfo:', userInfo);
    console.log('현재 branchId:', branchId);

    // 관리자는 모든 지부에 글쓰기 가능
    if (userInfo.isAdmin === true) {
      console.log('✅ 관리자 권한으로 허용');
      return true;
    }

    // 사용자의 지부 정보 확인 (Owner 역할만)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      console.log('branchRoles 배열:', userInfo.branchRoles);

      const isOwner = userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        console.log(`비교: ${userBranchId} (${typeof userBranchId}) === ${currentBranchId} (${typeof currentBranchId})`);
        console.log(`역할: ${role}`);
        console.log(`브랜치 일치: ${String(userBranchId) === String(currentBranchId)}`);
        console.log(`Owner 역할 확인: ${role} === "OWNER" = ${role === "OWNER"}`);

        const isSameBranch = String(userBranchId) === String(currentBranchId);
        const isOwnerRole = role === "OWNER";

        return isSameBranch && isOwnerRole;
      });

      console.log('✅ 최종 지부 Owner 여부:', isOwner);
      return isOwner;
    } else {
      console.log('❌ branchRoles 정보 없음');
    }

    return false;
  };

  // 권한 확인
  const checkWritePermission = () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      safeNavigate('/login');
      return;
    }

    if (postType === 'notice') {
      if (!isBranchOwner()) {
        alert('해당 지부의 Owner만 공지사항을 작성할 수 있습니다.');
        safeNavigate(`/branches/${branchId}`);
        return;
      }
    } else if (postType === 'board') {
      if (!isBranchMember()) {
        alert('해당 지부 회원만 글을 작성할 수 있습니다.');
        safeNavigate(`/branches/${branchId}`);
        return;
      }
    }
  };

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    return postType === 'notice' ? '/notice' : '/board';
  };

  // 게시글 타입에 따른 제목과 메시지
  const getPageTitle = () => {
    return postType === 'notice' ? '공지사항 작성' : '게시글 작성';
  };

  const getSuccessMessage = () => {
    return postType === 'notice' ? '공지사항이 성공적으로 작성되었습니다.' : '게시글이 성공적으로 작성되었습니다.';
  };

  const getLoadingMessage = () => {
    return postType === 'notice' ? '공지사항을 작성하고 있습니다...' : '게시글을 작성하고 있습니다...';
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 이미지 파일 선택 핸들러
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);

    if (images.length + files.length > maxImages) {
      alert(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
      return;
    }

    // 파일 크기 검증
    const oversizedFiles = files.filter(file => file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일 타입 검증
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // 미리보기 생성
    const newPreviews = [...imagePreviews];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push({
          file: file,
          url: e.target.result,
          name: file.name
        });
        setImagePreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 이미지 삭제 핸들러
  const handleImageRemove = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 폼 유효성 검증
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return false;
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return false;
    }

    if (formData.title.length > 100) {
      setError('제목은 100자 이하로 입력해주세요.');
      return false;
    }

    if (formData.content.length > 5000) {
      setError('내용은 5000자 이하로 입력해주세요.');
      return false;
    }

    return true;
  };

  // 게시글 작성 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) return;

    setIsSubmitting(true);
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // JSON 데이터를 Blob으로 변환하여 추가
      const requestBlob = new Blob([JSON.stringify(formData)], {
        type: 'application/json'
      });
      formDataToSend.append('request', requestBlob);

      // 이미지 파일들 추가
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const apiEndpoint = getApiEndpoint();
      console.log('게시글 작성 요청:', {
        endpoint: apiEndpoint,
        branchId,
        postType,
        title: formData.title,
        content: formData.content,
        imageCount: images.length
      });

      const response = await API.post(`${apiEndpoint}/${branchId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(getSuccessMessage());
        // BranchesDetail 페이지로 돌아가기
        safeNavigate(`/branches/${branchId}`);
      } else {
        throw new Error(response.data.message || '작성에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 작성 오류:', error);

      if (error.response) {
        if (error.response.status === 401) {
          setError('로그인이 필요합니다.');
        } else if (error.response.status === 403) {
          setError('글 작성 권한이 없습니다.');
        } else {
          setError(error.response.data?.message || '작성에 실패했습니다.');
        }
      } else {
        setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    if (formData.title || formData.content || images.length > 0) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        safeNavigate(`/branches/${branchId}`);
      }
    } else {
      safeNavigate(`/branches/${branchId}`);
    }
  };

  if (!branchId || !postType) {
    return (
        <div className="write-container">
          <div className="error-message">
            잘못된 접근입니다. 올바른 지부 페이지에서 접근해주세요.
          </div>
        </div>
    );
  }

  return (
      <div className="write-container">
        <div className="write-header">
          <h1>{getPageTitle()}</h1>
          <div className="write-actions">
            <button
                type="button"
                onClick={handleCancel}
                className="cancel-button"
                disabled={isSubmitting}
            >
              취소
            </button>
            <button
                type="submit"
                onClick={handleSubmit}
                className="submit-button"
                disabled={isSubmitting || loading}
            >
              {isSubmitting ? '작성 중...' : '작성 완료'}
            </button>
          </div>
        </div>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="write-form">
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="제목을 입력해주세요 (최대 100자)"
                maxLength={100}
                required
                disabled={isSubmitting}
            />
            <div className="char-count">
              {formData.title.length}/100
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="내용을 입력해주세요 (최대 5000자)"
                maxLength={5000}
                rows={15}
                required
                disabled={isSubmitting}
            />
            <div className="char-count">
              {formData.content.length}/5000
            </div>
          </div>

          <div className="form-group">
            <label>이미지 첨부</label>
            <div className="image-upload-section">
              <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  multiple
                  accept="image/*"
                  style={{ display: 'none' }}
                  disabled={isSubmitting}
              />
              <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="image-upload-button"
                  disabled={isSubmitting || images.length >= maxImages}
              >
                이미지 선택 ({images.length}/{maxImages})
              </button>
              <div className="upload-info">
                * 이미지는 최대 {maxImages}개, 각 파일당 10MB 이하만 업로드 가능합니다.
              </div>
            </div>

            {imagePreviews.length > 0 && (
                <div className="image-preview-container">
                  {imagePreviews.map((preview, index) => (
                      <div key={index} className="image-preview-item">
                        <img
                            src={preview.url}
                            alt={`미리보기 ${index + 1}`}
                            className="preview-image"
                        />
                        <button
                            type="button"
                            onClick={() => handleImageRemove(index)}
                            className="image-remove-button"
                            disabled={isSubmitting}
                        >
                          ×
                        </button>
                        <div className="image-name">{preview.name}</div>
                      </div>
                  ))}
                </div>
            )}
          </div>
        </form>

        {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>{getLoadingMessage()}</p>
            </div>
        )}
      </div>
  );
};

export default PostWrite;