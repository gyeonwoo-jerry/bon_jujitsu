import React, {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {normalizeUrl, POST_TYPE_CONFIGS} from '../../configs/postTypeConfigs';
import {usePostPermissions} from '../../hooks/usePostPermissions';
import {usePostValidation} from '../../hooks/usePostValidation';
import API from '../../utils/api';
import '../../styles/postWrite.css';
import SponsorFields from '../../components/write/SponsorFields';
import MediaUpload from '../../components/write/MediaUpload';
import RichTextEditor from '../../components/common/RichTextEditor'; // 새로운 에디터
import PostWriteHeader from '../../components/write/PostWriteHeader';

const PostWrite = () => {
  const { postType, branchId } = useParams();
  const navigate = useNavigate();
  const config = POST_TYPE_CONFIGS[postType];

  const { canWrite } = usePostPermissions(postType, null, branchId);
  const { validateForm } = usePostValidation(postType);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    url: ''
  });

  const [media, setMedia] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 에디터 사용 여부 결정
  const shouldUseRichEditor = () => {
    // 모든 게시글에서 리치 에디터 사용
    return true;
  };

  // 권한 체크
  useEffect(() => {
    if (!canWrite()) {
      alert(`${config?.title || '게시글'} 작성 권한이 없습니다.`);
      navigateToListPage();
    }
  }, [canWrite, config]);

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    switch (postType) {
      case 'notice':
        return '/notice';
      case 'skill':
        return '/skill';
      case 'news':
        return '/news';
      case 'faq':
        return '/qna';
      case 'sponsor':
        return '/sponsor';
      case 'board':
      default:
        return '/board';
    }
  };

  // 성공 메시지
  const getSuccessMessage = () => {
    switch (postType) {
      case 'notice':
        return '공지사항이 성공적으로 작성되었습니다.';
      case 'skill':
        return '스킬 게시물이 성공적으로 작성되었습니다.';
      case 'news':
        return '뉴스 게시물이 성공적으로 작성되었습니다.';
      case 'faq':
        return 'FAQ가 성공적으로 작성되었습니다.';
      case 'sponsor':
        return '제휴업체가 성공적으로 등록되었습니다.';
      case 'board':
      default:
        return '게시글이 성공적으로 작성되었습니다.';
    }
  };

  // 목록 페이지로 이동
  const navigateToListPage = () => {
    switch (postType) {
      case 'skill':
        navigate('/skill');
        break;
      case 'news':
        navigate('/news');
        break;
      case 'faq':
        navigate('/faq');
        break;
      case 'sponsor':
        navigate('/sponsor');
        break;
      case 'notice':
      case 'board':
        navigate(`/branches/${branchId}`);
        break;
      default:
        navigate('/');
        break;
    }
  };

  // 게시글 타입별 동영상 허용 여부
  const shouldAllowVideo = () => {
    return true; // 모든 게시글에서 동영상 허용
  };

  // 컨텐츠 유효성 검사 (HTML 태그 제거하여 실제 텍스트 길이 계산)
  const getContentTextLength = (htmlContent) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    // 리치 에디터 사용 시 HTML 내용에서 실제 텍스트 추출하여 검증
    let contentForValidation = formData.content;
    if (shouldUseRichEditor()) {
      const textContent = getContentTextLength(formData.content);
      if (!textContent.trim()) {
        setError('내용을 입력해주세요.');
        return;
      }
      // 검증용 객체 생성
      contentForValidation = textContent;
    }

    // 폼 검증
    const validation = validateForm({
      ...formData,
      content: contentForValidation
    });
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // 요청 데이터 구성
      let requestData = {
        title: formData.title.trim(),
        content: formData.content.trim() // HTML 콘텐츠 그대로 전송
      };

      // 제휴업체 전용 데이터
      if (postType === 'sponsor' && formData.url?.trim()) {
        requestData.url = normalizeUrl(formData.url.trim());
      }

      // 브랜치 ID 추가 (지부 게시물인 경우)
      if (branchId) {
        requestData.branchId = branchId;
      }

      // JSON 데이터를 Blob으로 변환하여 추가
      const requestBlob = new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      });
      formDataToSend.append('request', requestBlob);

      // 미디어 파일들 추가
      console.log('=== 미디어 파일 전송 ===');
      console.log('미디어 개수:', media.length);
      media.forEach((file, index) => {
        console.log(`파일 ${index}: ${file.name} (${file.type}, ${file.size} bytes)`);
        formDataToSend.append('files', file);
      });

      const apiEndpoint = getApiEndpoint();

      // API 엔드포인트별 URL 설정
      const url = (['skill', 'news', 'faq', 'sponsor'].includes(postType))
          ? apiEndpoint
          : `${apiEndpoint}/${branchId}`;

      const response = await API.post(url, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert(getSuccessMessage());
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
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // 리치 에디터 콘텐츠 변경 핸들러
  const handleContentChange = (content) => {
    setFormData(prev => ({
      ...prev,
      content: content
    }));
  };

  const handleCancel = () => {
    const hasContent = shouldUseRichEditor()
        ? getContentTextLength(formData.content).trim().length > 0
        : formData.content.trim().length > 0;

    if (formData.title || hasContent || media.length > 0) {
      if (window.confirm('작성 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        navigateToListPage();
      }
    } else {
      navigateToListPage();
    }
  };

  const handleMediaChange = (newMedia) => {
    setMedia(newMedia);
  };

  if (!config) {
    return <div className="write-container">잘못된 게시글 타입입니다.</div>;
  }

  // 콘텐츠 길이 계산 (리치 에디터용)
  const getDisplayContentLength = () => {
    if (shouldUseRichEditor()) {
      return getContentTextLength(formData.content).length;
    }
    return formData.content.length;
  };

  return (
      <div className="write-container">
        <PostWriteHeader
            title={`${config.title} 작성`}
            onCancel={handleCancel}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitText={postType === 'sponsor' ? '등록 완료' : '작성 완료'}
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

          {/* 콘텐츠 입력 필드 */}
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

          {/* 미디어 업로드 */}
          <MediaUpload
              media={media}
              onMediaChange={handleMediaChange}
              maxMedia={10}
              allowVideo={shouldAllowVideo()}
              disabled={isSubmitting}
          />
        </form>

        {isSubmitting && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>{getLoadingMessage(postType)}</p>
            </div>
        )}
      </div>
  );
};

// 헬퍼 함수들
const getContentPlaceholder = (postType) => {
  switch (postType) {
    case 'skill':
      return '스킬에 대한 상세한 내용을 입력해주세요. 제목, 이미지, 표 등을 자유롭게 추가할 수 있습니다.';
    case 'news':
      return '뉴스 내용을 입력해주세요. 다양한 서식과 미디어를 활용해보세요.';
    case 'notice':
      return '공지사항 내용을 입력해주세요';
    case 'faq':
      return 'FAQ 답변을 입력해주세요. 상세한 설명과 예시를 포함해주세요.';
    case 'sponsor':
      return '제휴업체에 대한 소개와 혜택 등을 입력해주세요';
    case 'board':
    default:
      return '내용을 입력해주세요';
  }
};

const getLoadingMessage = (postType) => {
  switch (postType) {
    case 'notice':
      return '공지사항을 작성하고 있습니다...';
    case 'skill':
      return '스킬 게시물을 작성하고 있습니다...';
    case 'news':
      return '뉴스 게시물을 작성하고 있습니다...';
    case 'faq':
      return 'FAQ를 작성하고 있습니다...';
    case 'sponsor':
      return '제휴업체를 등록하고 있습니다...';
    case 'board':
    default:
      return '게시글을 작성하고 있습니다...';
  }
};

export default PostWrite;