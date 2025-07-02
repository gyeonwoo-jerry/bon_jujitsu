import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import API from "../utils/api";
import { loggedNavigate } from "../utils/navigationLogger";
import "../styles/postWrite.css";

const PostWrite = () => {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const safeNavigate = loggedNavigate(navigate);

  const [branchId, setBranchId] = useState(null);
  const [postType, setPostType] = useState(null); // 'board', 'notice', 'skill', 'news', 'qna'
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    guestName: "",
    guestPassword: ""
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGuestPost, setIsGuestPost] = useState(false); // QnA 비회원 작성 여부

  const fileInputRef = useRef(null);
  const maxImages = 10;
  const maxImageSize = 10 * 1024 * 1024; // 10MB

  // URL에서 브랜치 ID와 게시물 타입 추출
  useEffect(() => {
    // 통합 라우트 처리: /write/:postType 또는 /branches/:branchId/:postType/write

    // 1. 전역 게시물 작성: /write/:postType (skill, news, qna)
    if (params.postType && !params.branchId) {
      const type = params.postType;

      if (['skill', 'news', 'qna'].includes(type)) {
        setPostType(type);
        setBranchId(null); // 전역 게시물은 브랜치와 무관
      } else {
        setError(`잘못된 게시글 타입입니다. 전역 게시물은 skill, news 또는 qna만 가능합니다.`);
      }
      return;
    }

    // 2. 지부별 게시물: /branches/:branchId/:postType/write
    if (params.branchId && params.postType) {
      setBranchId(params.branchId);
      const type = params.postType;

      // postType 유효성 검증 (board, notice만 허용)
      if (['board', 'notice'].includes(type)) {
        setPostType(type);
      } else {
        setError("잘못된 게시글 타입입니다. 지부 게시물은 board 또는 notice만 가능합니다.");
      }
      return;
    }

    // 3. 잘못된 접근
    setError("잘못된 접근입니다. 올바른 경로로 접근해주세요.");
  }, [params.branchId, params.postType]);

  // 권한 확인
  useEffect(() => {
    if (postType) {
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
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 모든 지부에 글쓰기 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (USER, COACH, OWNER 모든 역할 허용, PENDING 제외)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      const isMember = userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        // 해당 브랜치의 활성 역할(USER, COACH, OWNER) 허용, PENDING은 제외
        const isValidRole = ['USER', 'COACH', 'OWNER'].includes(role);
        const isSameBranch = String(userBranchId) === String(currentBranchId);

        return isSameBranch && isValidRole;
      });

      return isMember;
    }

    return false;
  };

  // 해당 지부의 Owner인지 확인 (공지사항용)
  const isBranchOwner = () => {
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 모든 지부에 글쓰기 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (Owner 역할만)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      const isOwner = userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        const isSameBranch = String(userBranchId) === String(currentBranchId);
        const isOwnerRole = role === "OWNER";

        return isSameBranch && isOwnerRole;
      });

      return isOwner;
    }

    return false;
  };

  // 스킬 작성 권한 확인 (Owner 또는 관리자만, 지부와 무관)
  const canWriteSkill = () => {
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 스킬 작성 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (어느 지부든 Owner 역할이 있으면 됨)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      const hasOwnerRole = userInfo.branchRoles.some(branchRole => {
        const role = branchRole.role;
        return role === "OWNER";
      });

      return hasOwnerRole;
    }

    return false;
  };

  // 뉴스 작성 권한 확인 (관리자만, 지부와 무관)
  const canWriteNews = () => {
    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자만 뉴스 작성 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    return false;
  };

  // QnA 작성 권한 확인 (로그인 사용자 또는 비회원 모두 가능)
  const canWriteQna = () => {
    return true; // QnA는 누구나 작성 가능
  };

  // 권한 확인
  const checkWritePermission = () => {
    if (postType === 'qna') {
      // QnA는 로그인 여부에 상관없이 작성 가능
      return;
    }

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
    } else if (postType === 'skill') {
      if (!canWriteSkill()) {
        alert('스킬 게시물은 관장이나 관리자만 작성할 수 있습니다.');
        safeNavigate('/skill');
        return;
      }
    } else if (postType === 'news') {
      if (!canWriteNews()) {
        alert('뉴스 게시물은 관리자만 작성할 수 있습니다.');
        safeNavigate('/news');
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
    switch (postType) {
      case 'notice':
        return '/notice';
      case 'skill':
        return '/skill';
      case 'news':
        return '/news';
      case 'qna':
        return '/qna';
      case 'board':
      default:
        return '/board';
    }
  };

  // 게시글 타입에 따른 제목과 메시지
  const getPageTitle = () => {
    switch (postType) {
      case 'notice':
        return '공지사항 작성';
      case 'skill':
        return '스킬 게시물 작성';
      case 'news':
        return '뉴스 게시물 작성';
      case 'qna':
        return 'QnA 작성';
      case 'board':
      default:
        return '게시글 작성';
    }
  };

  const getSuccessMessage = () => {
    switch (postType) {
      case 'notice':
        return '공지사항이 성공적으로 작성되었습니다.';
      case 'skill':
        return '스킬 게시물이 성공적으로 작성되었습니다.';
      case 'news':
        return '뉴스 게시물이 성공적으로 작성되었습니다.';
      case 'qna':
        return 'QnA가 성공적으로 작성되었습니다.';
      case 'board':
      default:
        return '게시글이 성공적으로 작성되었습니다.';
    }
  };

  const getLoadingMessage = () => {
    switch (postType) {
      case 'notice':
        return '공지사항을 작성하고 있습니다...';
      case 'skill':
        return '스킬 게시물을 작성하고 있습니다...';
      case 'news':
        return '뉴스 게시물을 작성하고 있습니다...';
      case 'qna':
        return 'QnA를 작성하고 있습니다...';
      case 'board':
      default:
        return '게시글을 작성하고 있습니다...';
    }
  };

  const getContentPlaceholder = () => {
    switch (postType) {
      case 'skill':
        return '스킬에 대한 상세한 내용을 입력해주세요 (최대 5000자)';
      case 'news':
        return '뉴스 내용을 입력해주세요 (최대 5000자)';
      case 'notice':
        return '공지사항 내용을 입력해주세요 (최대 5000자)';
      case 'qna':
        return '질문 내용을 입력해주세요 (최대 5000자)';
      case 'board':
      default:
        return '내용을 입력해주세요 (최대 5000자)';
    }
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // QnA 작성 모드 변경 핸들러
  const handleQnaTypeChange = (e) => {
    const isGuest = e.target.value === 'guest';
    setIsGuestPost(isGuest);

    if (!isGuest) {
      // 회원 작성으로 변경시 비회원 정보 초기화
      setFormData(prev => ({
        ...prev,
        guestName: "",
        guestPassword: ""
      }));
    }
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

    // QnA 비회원 작성시 추가 검증
    if (postType === 'qna' && isGuestPost) {
      if (!formData.guestName.trim()) {
        setError('이름을 입력해주세요.');
        return false;
      }

      if (!formData.guestPassword.trim()) {
        setError('비밀번호를 입력해주세요.');
        return false;
      }

      if (formData.guestPassword.length < 4) {
        setError('비밀번호는 4자 이상 입력해주세요.');
        return false;
      }
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

      // 요청 데이터 구성
      let requestData = {
        title: formData.title,
        content: formData.content
      };

      // QnA 비회원 작성시 추가 데이터
      if (postType === 'qna' && isGuestPost) {
        requestData.guestName = formData.guestName;
        requestData.guestPassword = formData.guestPassword;
      }

      // JSON 데이터를 Blob으로 변환하여 추가
      const requestBlob = new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      });
      formDataToSend.append('request', requestBlob);

      // 이미지 파일들 추가
      images.forEach(image => {
        formDataToSend.append('images', image);
      });

      const apiEndpoint = getApiEndpoint();

      // API 엔드포인트별 URL 설정 (skill, news, qna는 브랜치 ID 없음)
      const url = (['skill', 'news', 'qna'].includes(postType)) ? apiEndpoint : `${apiEndpoint}/${branchId}`;

      const response = await API.post(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(getSuccessMessage());
        // 타입에 따른 적절한 페이지로 이동
        navigateToListPage();
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
        navigateToListPage();
      }
    } else {
      navigateToListPage();
    }
  };

  // 타입에 따른 목록 페이지로 이동
  const navigateToListPage = () => {
    switch (postType) {
      case 'skill':
        safeNavigate('/skill');
        break;
      case 'news':
        safeNavigate('/news');
        break;
      case 'qna':
        safeNavigate('/qna');
        break;
      case 'notice':
      case 'board':
        safeNavigate(`/branches/${branchId}`);
        break;
      default:
        safeNavigate('/');
        break;
    }
  };

  // 에러 처리: skill, news, qna는 branchId가 없어도 됨
  if (!['skill', 'news', 'qna'].includes(postType) && !branchId) {
    return (
        <div className="write-container">
          <div className="error-message">
            잘못된 접근입니다. 올바른 지부 페이지에서 접근해주세요.
          </div>
        </div>
    );
  }

  if (!postType) {
    return (
        <div className="write-container">
          <div className="error-message">
            잘못된 게시글 타입입니다.
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
          {/* QnA 작성 모드 선택 */}
          {postType === 'qna' && (
              <div className="form-group">
                <label>작성 모드</label>
                <div className="qna-type-selector">
                  <label className="radio-label">
                    <input
                        type="radio"
                        name="qnaType"
                        value="member"
                        checked={!isGuestPost}
                        onChange={handleQnaTypeChange}
                        disabled={isSubmitting}
                    />
                    회원 작성
                  </label>
                  <label className="radio-label">
                    <input
                        type="radio"
                        name="qnaType"
                        value="guest"
                        checked={isGuestPost}
                        onChange={handleQnaTypeChange}
                        disabled={isSubmitting}
                    />
                    비회원 작성
                  </label>
                </div>
              </div>
          )}

          {/* 비회원 작성시 이름, 비밀번호 입력 */}
          {postType === 'qna' && isGuestPost && (
              <>
                <div className="form-group">
                  <label htmlFor="guestName">이름 *</label>
                  <input
                      type="text"
                      id="guestName"
                      name="guestName"
                      value={formData.guestName}
                      onChange={handleInputChange}
                      placeholder="이름을 입력해주세요"
                      maxLength={20}
                      required
                      disabled={isSubmitting}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="guestPassword">비밀번호 *</label>
                  <input
                      type="password"
                      id="guestPassword"
                      name="guestPassword"
                      value={formData.guestPassword}
                      onChange={handleInputChange}
                      placeholder="비밀번호를 입력해주세요 (4자 이상)"
                      maxLength={20}
                      required
                      disabled={isSubmitting}
                  />
                  <div className="password-info">
                    * 비회원 작성시 수정/삭제를 위해 비밀번호가 필요합니다.
                  </div>
                </div>
              </>
          )}

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
                placeholder={getContentPlaceholder()}
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