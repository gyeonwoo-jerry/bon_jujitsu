import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {normalizeUrl, POST_TYPE_CONFIGS} from '../../configs/postTypeConfigs';
import {usePostData} from '../../hooks/usePostData';
import {usePostPermissions} from '../../hooks/usePostPermissions';
import {usePostValidation} from '../../hooks/usePostValidation';
import RichTextEditor from '../../components/common/RichTextEditor';
import API from '../../utils/api';
import '../../styles/postWrite.css';

import SponsorFields from '../../components/write/SponsorFields';
import MediaUploadEdit from '../../components/write/MediaUploadEdit';
import PostWriteHeader from '../../components/write/PostWriteHeader';

const PostEdit = () => {
  const {postType, postId, branchId} = useParams();
  const navigate = useNavigate();
  const config = POST_TYPE_CONFIGS[postType];

  // 커스텀 훅으로 게시글 데이터 로드
  const {
    originalPost,
    loading: dataLoading,
    error: dataError
  } = usePostData(postType, postId);

  const {canEdit} = usePostPermissions(postType, originalPost, branchId);
  const {validateForm} = usePostValidation(postType);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: ''
  });

  // 미디어 관련 상태 (이미지 → 미디어로 변경)
  const [existingMedia, setExistingMedia] = useState([]);
  const [newMedia, setNewMedia] = useState([]);
  const [keepMediaIds, setKeepMediaIds] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 미디어 URL 정규화
  const normalizeMediaUrl = (url) => {
    if (!url || typeof url !== 'string') {
      return "/images/blank_img.png";
    }

    if (url.startsWith("http://") || url.startsWith("https://")
        || url.startsWith("/")) {
      return url;
    }

    return `/${url}`;
  };

  // 게시글 타입별 동영상 허용 여부
  const shouldAllowVideo = () => {
    return true; // 모든 게시글에서 동영상 허용
  };

  // 원본 데이터로 폼 초기화
  useEffect(() => {
    if (originalPost) {
      setFormData({
        title: originalPost.title || '',
        content: originalPost.content || '',
        url: originalPost.url || ''
      });

      // 기존 미디어 설정 (media 필드 사용)
      if (originalPost.media && Array.isArray(originalPost.media)) {
        const mediaObjects = originalPost.media.map((media, index) => ({
          id: media.id || index,
          url: normalizeMediaUrl(media.url || media.filePath),
          mediaType: media.mediaType || 'IMAGE',
          originalFileName: media.originalFileName || ''
        }));

        setExistingMedia(mediaObjects);
        const mediaIds = mediaObjects.map(media => media.id);
        setKeepMediaIds(mediaIds);
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

    if (isSubmitting) {
      return;
    }

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

      // 새 미디어들 추가
      newMedia.forEach(media => {
        formDataToSend.append('files', media);
      });

      // 유지할 미디어 ID들 추가
      if (keepMediaIds.length > 0) {
        const keepMediaIdsBlob = new Blob([JSON.stringify(keepMediaIds)], {
          type: 'application/json'
        });
        formDataToSend.append('keepfileIds', keepMediaIdsBlob);
      }

      const apiEndpoint = getApiEndpoint();
      const response = await API.patch(`${apiEndpoint}/${postId}`,
          formDataToSend, {
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
    const {name, value, type, checked} = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 에디터 사용 여부 결정
  const shouldUseRichEditor = () => {
    // 모든 게시글에서 리치 에디터 사용
    return true;
  };

// 콘텐츠 길이 계산 함수
  const getContentTextLength = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

// 리치 에디터 콘텐츠 변경 핸들러
  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }));
  };

// 콘텐츠 길이 계산 (리치 에디터용)
  const getDisplayContentLength = () => {
    if (shouldUseRichEditor()) {
      return getContentTextLength(formData.content).length;
    }
    return formData.content.length;
  };

  const handleCancel = () => {
    const hasChanges =
        formData.title !== originalPost?.title ||
        formData.content !== originalPost?.content ||
        (postType === 'sponsor' && formData.url !== (originalPost?.url || ''))
        ||
        newMedia.length > 0 ||
        keepMediaIds.length !== existingMedia.length;

    if (hasChanges) {
      if (window.confirm('수정 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigate(-1);
      }
    } else {
      navigate(-1);
    }
  };

  // 새 미디어 변경 핸들러
  const handleNewMediaChange = (newMediaFiles) => {
    setNewMedia(newMediaFiles);
  };

  // 유지할 미디어 ID 변경 핸들러
  const handleKeepMediaIdsChange = (newKeepIds) => {
    setKeepMediaIds(newKeepIds);
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

            {shouldUseRichEditor() ? (
                // 리치 에디터 사용
                <>
                  <RichTextEditor
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder={getContentPlaceholder(postType)}
                      disabled={isSubmitting}
                      height="500px"
                  />
                  <div className="char-count">
                    {getDisplayContentLength()}/{config.validation.contentMaxLength} 글자
                  </div>
                </>
            ) : (
                // 기본 텍스트 에어리어 사용
                <>
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
                </>
            )}
          </div>

          {/* 미디어 업로드 섹션 (새로운 컴포넌트 사용) */}
          <MediaUploadEdit
              existingMedia={existingMedia}
              newMedia={newMedia}
              keepMediaIds={keepMediaIds}
              onNewMediaChange={handleNewMediaChange}
              onKeepMediaIdsChange={handleKeepMediaIdsChange}
              maxMedia={10}
              allowVideo={shouldAllowVideo()}
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
    case 'skill':
      return '스킬에 대한 상세한 내용을 입력해주세요';
    case 'news':
      return '뉴스 내용을 입력해주세요';
    case 'notice':
      return '공지사항 내용을 입력해주세요';
    case 'faq':
      return 'FAQ 내용을 입력해주세요';
    case 'sponsor':
      return '제휴업체에 대한 소개와 혜택 등을 입력해주세요';
    case 'board':
    default:
      return '내용을 입력해주세요';
  }
};

export default PostEdit;