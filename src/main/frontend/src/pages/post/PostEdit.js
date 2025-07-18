import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {normalizeUrl, POST_TYPE_CONFIGS} from '../../configs/postTypeConfigs';
import {usePostData} from '../../hooks/usePostData';
import {usePostPermissions} from '../../hooks/usePostPermissions';
import {usePostValidation} from '../../hooks/usePostValidation';
import API from '../../utils/api';
import '../../styles/postWrite.css';

import SponsorFields from '../../components/write/SponsorFields';
import PostWriteHeader from '../../components/write/PostWriteHeader';

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
    url: ''
  });

  // 이미지 관련 상태
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [keepImageIds, setKeepImageIds] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 이미지 URL 정규화
  const normalizeImageUrl = (url) => {
    if (!url || typeof url !== 'string') {
      return "/images/blank_img.png";
    }

    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) {
      return url;
    }

    return `/${url}`;
  };

  // 원본 데이터로 폼 초기화
  useEffect(() => {
    if (originalPost) {
      setFormData({
        title: originalPost.title || '',
        content: originalPost.content || '',
        url: originalPost.url || ''
      });

      // 기존 이미지 설정 (media 필드 사용)
      if (originalPost.media && Array.isArray(originalPost.media)) {
        const imageObjects = originalPost.media.map((img, index) => ({
          id: img.id || index,
          url: normalizeImageUrl(img.url)
        }));

        setExistingImages(imageObjects);
        const imageIds = imageObjects.map(img => img.id);
        setKeepImageIds(imageIds);
      }
    }
  }, [originalPost, postType]);

  // 권한 체크
  useEffect(() => {
    if (originalPost && !canEdit()) {
      alert(`${config?.title || '게시글'} 수정 권한이 없습니다.`);
      navigate(-1);
    }
  }, [originalPost, canEdit, config, navigate]);

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

      // 제휴업체 전용 데이터
      if (postType === 'sponsor' && formData.url?.trim()) {
        updateData.url = normalizeUrl(formData.url.trim());
      }

      // JSON 데이터를 Blob으로 변환
      const updateBlob = new Blob([JSON.stringify(updateData)], {
        type: 'application/json'
      });
      formDataToSend.append('update', updateBlob);

      // 새 이미지들 추가
      newImages.forEach(image => {
        formDataToSend.append('files', image);
      });

      // 유지할 이미지 ID들 추가
      if (keepImageIds.length > 0) {
        const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds)], {
          type: 'application/json'
        });
        formDataToSend.append('keepfileIds', keepImageIdsBlob);
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

  // 기존 이미지 삭제
  const handleExistingImageDelete = (imageId) => {
    setKeepImageIds(prev => prev.filter(id => id !== imageId));
  };

  // 새 이미지 추가
  const handleNewImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const totalImages = existingImages.length - (existingImages.length - keepImageIds.length) + newImages.length;

    if (totalImages + files.length > 10) {
      alert('최대 10개의 이미지만 업로드할 수 있습니다.');
      return;
    }

    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        alert(`${file.name}은 10MB를 초과합니다.`);
        return;
      }
    });

    setNewImages(prev => [...prev, ...files]);
    e.target.value = '';
  };

  // 새 이미지 삭제
  const handleNewImageDelete = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // 이미지 미리보기 URL 생성
  const getImagePreviewUrl = (file) => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return file;
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

  const totalImages = keepImageIds.length + newImages.length;

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

          {/* 이미지 업로드 섹션 */}
          <div className="form-group">
            <label>이미지 ({totalImages}/10)</label>

            {/* 기존 이미지들 */}
            {existingImages.length > 0 && (
                <div className="image-section">
                  <h4>기존 이미지</h4>
                  <div className="image-grid">
                    {existingImages.map((image) => (
                        <div key={image.id} className="image-item">
                          <img
                              src={image.url}
                              alt={`기존 이미지 ${image.id}`}
                              className="image-preview"
                              onError={(e) => {
                                e.target.src = "/images/blank_img.png";
                              }}
                          />
                          <button
                              type="button"
                              className={`image-delete-btn ${keepImageIds.includes(image.id) ? '' : 'deleted'}`}
                              onClick={() => {
                                if (keepImageIds.includes(image.id)) {
                                  handleExistingImageDelete(image.id);
                                } else {
                                  setKeepImageIds(prev => [...prev, image.id]);
                                }
                              }}
                              disabled={isSubmitting}
                          >
                            {keepImageIds.includes(image.id) ? '×' : '↺'}
                          </button>
                          {!keepImageIds.includes(image.id) && (
                              <div className="image-deleted-overlay">삭제됨</div>
                          )}
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* 새 이미지들 */}
            {newImages.length > 0 && (
                <div className="image-section">
                  <h4>새 이미지</h4>
                  <div className="image-grid">
                    {newImages.map((image, index) => (
                        <div key={index} className="image-item">
                          <img
                              src={getImagePreviewUrl(image)}
                              alt={`새 이미지 ${index}`}
                              className="image-preview"
                          />
                          <button
                              type="button"
                              className="image-delete-btn"
                              onClick={() => handleNewImageDelete(index)}
                              disabled={isSubmitting}
                          >
                            ×
                          </button>
                        </div>
                    ))}
                  </div>
                </div>
            )}

            {/* 이미지 추가 버튼 */}
            {totalImages < 10 && (
                <div className="image-upload-section">
                  <input
                      type="file"
                      id="images"
                      multiple
                      accept="image/*"
                      onChange={handleNewImageAdd}
                      disabled={isSubmitting}
                      style={{ display: 'none' }}
                  />
                  <label htmlFor="images" className="image-upload-btn">
                    + 이미지 추가 ({totalImages}/10)
                  </label>
                </div>
            )}

            <div className="image-upload-info">
              <p>• 최대 10개의 이미지를 업로드할 수 있습니다.</p>
              <p>• 각 이미지는 10MB 이하여야 합니다.</p>
              <p>• 지원 형식: JPG, PNG, GIF, WebP</p>
            </div>
          </div>
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
    case 'faq': return 'FAQ 내용을 입력해주세요';
    case 'sponsor': return '제휴업체에 대한 소개와 혜택 등을 입력해주세요';
    case 'board':
    default: return '내용을 입력해주세요';
  }
};

export default PostEdit;