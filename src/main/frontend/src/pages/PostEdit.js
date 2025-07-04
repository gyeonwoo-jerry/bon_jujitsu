import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { POST_TYPE_CONFIGS, normalizeUrl } from '../configs/postTypeConfigs';
import { usePostData } from '../hooks/usePostData';
import { usePostPermissions } from '../hooks/usePostPermissions';
import { usePostValidation } from '../hooks/usePostValidation';
import API from '../utils/api';
import '../styles/postWrite.css';

import SponsorFields from '../components/write/SponsorFields';
import ImageUploadEdit from '../components/write/ImageUploadEdit';
import PostWriteHeader from '../components/write/PostWriteHeader';

const PostEdit = () => {
  const { postType, postId, branchId } = useParams();
  const navigate = useNavigate();
  const config = POST_TYPE_CONFIGS[postType];

  // 커스텀 훅으로 게시글 데이터 로드
  const {
    originalPost,
    loading: dataLoading,
    error: dataError
  } = usePostData(postType, postId);

  const { canEdit } = usePostPermissions(postType, originalPost, branchId);
  const { validateForm } = usePostValidation(postType);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    guestName: '',
    guestPassword: '',
    url: '',
    isGuestPost: false
  });

  // 이미지 관련 상태
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [keepImageIds, setKeepImageIds] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 원본 데이터로 폼 초기화
  useEffect(() => {
    if (originalPost) {
      const isGuest = postType === 'qna' && originalPost.guestName;

      setFormData({
        title: originalPost.title || '',
        content: originalPost.content || '',
        guestName: originalPost.guestName || '',
        guestPassword: '', // 보안상 비워둠
        url: originalPost.url || '',
        isGuestPost: isGuest
      });

      // 기존 이미지 설정
      if (originalPost.images && Array.isArray(originalPost.images)) {
        const imageObjects = originalPost.images.map((img, index) => ({
          id: img.id || index,
          url: img.url
        }));

        setExistingImages(imageObjects);
        const imageIds = imageObjects.map(img => img.id);
        setKeepImageIds(imageIds);
      }
    }
  }, [originalPost, postType]);

  // 권한 체크
  useEffect(() => {
    if (originalPost) {
      const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const isLoggedIn = !!localStorage.getItem('token') || !!localStorage.getItem('accessToken');
      const isAdmin = userInfo.role === 'ADMIN' || userInfo.isAdmin === true;

      // QnA 비회원 게시글 특별 처리
      if (postType === 'qna' && originalPost.isGuestPost) {
        // 관리자가 아닌 로그인한 일반 회원은 비회원 글 수정 불가
        if (isLoggedIn && !isAdmin) {
          alert('비회원이 작성한 글은 일반 회원이 수정할 수 없습니다.');
          navigate(-1);
          return;
        }
        // 비회원(미로그인)이거나 관리자인 경우 수정 페이지 접근 허용
        // 비회원의 경우 비밀번호 검증은 서버에서 처리
        return;
      }

      // 일반 게시글의 경우 기존 권한 체크
      if (!canEdit()) {
        alert(`${config?.title || '게시글'} 수정 권한이 없습니다.`);
        navigate(-1);
      }
    }
  }, [originalPost, canEdit, config, navigate, postType]);

  // 성공 메시지
  const getSuccessMessage = () => {
    return `${config.title}이 성공적으로 수정되었습니다.`;
  };

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    return config.apiEndpoint;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // 폼 검증
    const validation = validateForm(formData);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // 요청 데이터 구성
      let updateData = {
        title: formData.title.trim(),
        content: formData.content.trim()
      };

      // QnA 비회원 수정시 비밀번호 포함
      if (postType === 'qna' && formData.isGuestPost && formData.guestPassword) {
        updateData.guestPassword = formData.guestPassword;
      }

      // 제휴업체 전용 데이터
      if (postType === 'sponsor' && formData.url?.trim()) {
        updateData.url = normalizeUrl(formData.url.trim());
      }

      // JSON 데이터를 Blob으로 변환 (기존 방식 유지)
      const updateBlob = new Blob([JSON.stringify(updateData)], {
        type: 'application/json'
      });
      formDataToSend.append('update', updateBlob);

      // 새 이미지들 추가
      newImages.forEach(image => {
        formDataToSend.append('images', image);
      });

      // 유지할 이미지 ID들 추가
      if (keepImageIds.length > 0) {
        const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds)], {
          type: 'application/json'
        });
        formDataToSend.append('keepImageIds', keepImageIdsBlob);
      }

      const apiEndpoint = getApiEndpoint();
      const response = await API.patch(`${apiEndpoint}/${postId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(getSuccessMessage());
        navigate(-1);
      } else {
        throw new Error(response.data.message || '수정에 실패했습니다.');
      }

    } catch (error) {
      console.error('게시글 수정 오류:', error);

      if (error.response) {
        if (error.response.status === 401) {
          setError('로그인이 필요합니다.');
        } else if (error.response.status === 403) {
          setError('수정 권한이 없습니다.');
        } else {
          setError(error.response.data?.message || '수정에 실패했습니다.');
        }
      } else {
        setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCancel = () => {
    const hasChanges =
        formData.title !== originalPost?.title ||
        formData.content !== originalPost?.content ||
        (postType === 'sponsor' && formData.url !== (originalPost?.url || '')) ||
        newImages.length > 0 ||
        keepImageIds.length !== existingImages.length;

    if (hasChanges) {
      if (window.confirm('수정 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  const handleNewImagesChange = (images) => {
    setNewImages(images);
  };

  const handleKeepImageIdsChange = (ids) => {
    setKeepImageIds(ids);
  };

  // 로딩 상태
  if (dataLoading) {
    return (
        <div className="write-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>게시글 정보를 불러오는 중...</p>
          </div>
        </div>
    );
  }

  // 에러 상태
  if (dataError || !originalPost) {
    return (
        <div className="write-container">
          <div className="error-message">
            <h3>게시글을 찾을 수 없습니다</h3>
            <p>{dataError || '알 수 없는 오류가 발생했습니다.'}</p>
            <button onClick={() => navigate(-1)} className="btn-secondary">
              돌아가기
            </button>
          </div>
        </div>
    );
  }

  if (!config) {
    return <div className="write-container">잘못된 게시글 타입입니다.</div>;
  }

  return (
      <div className="write-container">
        <PostWriteHeader
            title={`${config.title} 수정`}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitText="수정 완료"
            cancelText="취소"
        />

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="write-form">
          {/* QnA 비회원 필드 */}
          {postType === 'qna' && formData.isGuestPost && (
              <div className="guest-info-section">
                <div className="form-group">
                  <label htmlFor="guestName">작성자명</label>
                  <input
                      type="text"
                      id="guestName"
                      name="guestName"
                      value={formData.guestName}
                      disabled={true}
                      className="disabled-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="guestPassword">비밀번호 확인 *</label>
                  <input
                      type="password"
                      id="guestPassword"
                      name="guestPassword"
                      value={formData.guestPassword}
                      onChange={handleInputChange}
                      placeholder="수정을 위해 기존 비밀번호를 입력해주세요"
                      maxLength={20}
                      required
                      disabled={isSubmitting}
                  />
                  <div className="password-info">
                    * 수정을 위해 기존 비밀번호를 입력해야 합니다.
                  </div>
                </div>
              </div>
          )}

          {/* 제휴업체 필드 */}
          {postType === 'sponsor' && (
              <SponsorFields
                  formData={formData}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
              />
          )}

          {/* 공통 필드들 */}
          <div className="form-group">
            <label htmlFor="title">
              {postType === 'sponsor' ? '업체명' : '제목'} *
            </label>
            <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder={
                  postType === 'sponsor'
                      ? '제휴업체명을 입력해주세요'
                      : '제목을 입력해주세요'
                }
                maxLength={config.validation.titleMaxLength}
                disabled={isSubmitting}
                required
            />
            <div className="char-count">
              {formData.title.length}/{config.validation.titleMaxLength}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder={getContentPlaceholder(postType)}
                maxLength={config.validation.contentMaxLength}
                rows={15}
                disabled={isSubmitting}
                required
            />
            <div className="char-count">
              {formData.content.length}/{config.validation.contentMaxLength}
            </div>
          </div>

          <ImageUploadEdit
              existingImages={existingImages}
              newImages={newImages}
              keepImageIds={keepImageIds}
              onNewImagesChange={handleNewImagesChange}
              onKeepImageIdsChange={handleKeepImageIdsChange}
              maxImages={10}
              disabled={isSubmitting}
          />
        </form>

        {isSubmitting && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>{config.title}을 수정하고 있습니다...</p>
            </div>
        )}
      </div>
  );
};

// 헬퍼 함수들
const getContentPlaceholder = (postType) => {
  switch (postType) {
    case 'skill': return '스킬에 대한 상세한 내용을 입력해주세요';
    case 'news': return '뉴스 내용을 입력해주세요';
    case 'notice': return '공지사항 내용을 입력해주세요';
    case 'qna': return '질문 내용을 입력해주세요';
    case 'sponsor': return '제휴업체에 대한 소개와 혜택 등을 입력해주세요';
    case 'board':
    default: return '내용을 입력해주세요';
  }
};

export default PostEdit;