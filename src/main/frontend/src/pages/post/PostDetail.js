import React, {useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {POST_TYPE_CONFIGS} from '../../configs/postTypeConfigs';
import {usePostData} from '../../hooks/usePostData';
import {usePostPermissions} from '../../hooks/usePostPermissions';
import API from '../../utils/api';
import '../../styles/postDetail.css';

import SubHeader from '../../components/SubHeader';
import PostDetailHeader from '../../components/detail/PostDetailHeader';
import PostDetailContent from '../../components/detail/PostDetailContent';
import PostDetailMeta from '../../components/detail/PostDetailMeta';
import Comment from '../../components/Comment';
import ImageModal from '../../components/modals/ImageModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const PostDetail = () => {
  const { postType, postId, branchId } = useParams();
  const navigate = useNavigate();
  const config = POST_TYPE_CONFIGS[postType];

  // 커스텀 훅들로 로직 분리
  const {
    originalPost: post,
    loading,
    error
  } = usePostData(postType, postId);

  const { canEdit, isAdmin, isAuthor, isLoggedIn } = usePostPermissions(postType, post, branchId);

  // UI 상태
  const [selectedImage, setSelectedImage] = useState(null);

  // 게시물 데이터 정규화 함수
  const normalizePostData = (rawPost) => {
    if (!rawPost) return null;

    // 이미지/미디어 데이터 정규화
    const normalizeMedia = (mediaData) => {
      if (!mediaData || !Array.isArray(mediaData)) return [];

      return mediaData.map(item => ({
        id: item.id,
        url: item.url || item.imagePath || item.filePath, // 다양한 URL 필드 대응
        originalFileName: item.originalFileName || '',
        mediaType: item.mediaType || 'IMAGE'
      }));
    };

    // 작성자 정보 정규화
    const normalizeAuthor = (authorData, authorName, authorId) => {
      // 새로운 구조에서는 author, authorId 필드 직접 사용
      if (authorName && authorId) {
        return authorName; // 문자열로 반환
      }

      // 기존 구조 대응
      if (authorData && typeof authorData === 'object') {
        return authorData.name || '작성자 정보 없음';
      }

      return authorName || authorData || '작성자 정보 없음';
    };

    return {
      ...rawPost,
      // 이미지/미디어 정규화 (모든 Response가 media 필드 사용)
      images: normalizeMedia(rawPost.media || []),
      // 작성자 정보 정규화 (문자열로 처리)
      author: normalizeAuthor(rawPost.author, rawPost.author, rawPost.authorId),
      authorId: rawPost.authorId,
      // QnA 특별 처리
      authorName: rawPost.authorName || rawPost.author,
      isGuestPost: rawPost.isGuestPost || false,
      hasAnswer: rawPost.hasAnswer || false,
      // 날짜 정규화
      createdAt: rawPost.createdAt,
      modifiedAt: rawPost.modifiedAt || rawPost.modifiedAT, // 오타 대응
      // ✅ 스킬 정보 추가
      position: rawPost.position || '',
      skillType: rawPost.skillType || '',
      // 기타 필드들
      viewCount: rawPost.viewCount || 0,
      region: rawPost.region || ''
    };
  };

  // 정규화된 게시물 데이터
  const normalizedPost = normalizePostData(post);

  // 수정 버튼 클릭 핸들러
  const handleEdit = () => {
    let editPath;
    switch (postType) {
      case 'notice':
      case 'board':
        // 지부 게시물은 branchId가 필요
        editPath = `/branches/${branchId}/${postType}/${postId}/edit`;
        break;
      case 'skill':
      case 'news':
      case 'sponsor':
      case 'faq':
      case 'qna':
        // 일반 게시물은 /edit/:postType/:postId 형태
        editPath = `/edit/${postType}/${postId}`;
        break;
      default:
        editPath = `/edit/${postType}/${postId}`;
        break;
    }
    navigate(editPath);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDelete = () => {
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      performDelete();
    }
  };

  // 실제 삭제 수행
  const performDelete = async () => {
    try {
      let deleteEndpoint;

      // 새로운 API 엔드포인트에 맞춰 수정
      switch (postType) {
        case 'notice':
          deleteEndpoint = `/notice/${postId}`;
          break;
        case 'news':
          deleteEndpoint = `/news/${postId}`;
          break;
        case 'skill':
          deleteEndpoint = `/skill/${postId}`;
          break;
        case 'sponsor':
          deleteEndpoint = `/sponsor/${postId}`;
          break;
        case 'qna':
          deleteEndpoint = `/qna/${postId}`;
          break;
        default:
          deleteEndpoint = `/${postType}/${postId}`;
          break;
      }

      const response = await API.delete(deleteEndpoint);

      if (response.data.success) {
        alert('게시글이 삭제되었습니다.');
        handleBackToList();
      } else {
        throw new Error(response.data.message || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('삭제 오류:', error);
      if (error.response) {
        alert(error.response.data?.message || '삭제에 실패했습니다.');
      } else {
        alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    }
  };

  // 다른 게시판의 수정/삭제 버튼 노출 조건
  const shouldShowButtons = () => {
    // 이제 canEdit() 함수에서 각 타입별 권한을 모두 처리하므로
    return canEdit();
  };

  // 이미지 모달 처리
  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
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
      case 'qna':
        navigate('/qna');
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

  // 로딩 상태
  if (loading) {
    return (
        <div className="board-detail-container">
          <LoadingSpinner message="게시글을 불러오는 중..." />
        </div>
    );
  }

  // 에러 상태
  if (error || !normalizedPost) {
    return (
        <div className="board-detail-container">
          <ErrorMessage
              title="게시글을 찾을 수 없습니다"
              message={error}
              onBack={handleBackToList}
          />
        </div>
    );
  }

  if (!config) {
    return (
        <div className="board-detail-container">
          <ErrorMessage
              title="잘못된 게시글 타입입니다"
              onBack={handleBackToList}
          />
        </div>
    );
  }

  return (
      <>
        {/* SubHeader - 특정 타입에만 표시 */}
        {(['skill', 'news', 'faq', 'sponsor', 'qna'].includes(postType)) && (
            <SubHeader
                pageName={`${config.title} 상세`}
                descName={`본주짓수 ${config.title}를 확인해보세요`}
            />
        )}

        <div className={`board-detail-container ${postType}-detail`}>
          {/* 헤더 (뒤로가기, 수정/삭제 버튼) */}
          <PostDetailHeader
              postType={postType}
              post={normalizedPost}
              canEdit={shouldShowButtons}
              onBack={handleBackToList}
              onEdit={handleEdit}
              onDelete={handleDelete}
          />

          <div className="board-detail-content">
            {/* 메타 정보 (제목, 작성자, 날짜 등) */}
            <PostDetailMeta
                post={normalizedPost}
                postType={postType}
                config={config}
            />

            {/* 본문 내용 */}
            <PostDetailContent
                post={normalizedPost}
                postType={postType}
                onImageClick={openImageModal}
                normalizeImageUrl={normalizeImageUrl}
            />
          </div>

          {/* 댓글 섹션 */}
          {config.showComments && (
              <Comment
                  postId={postId}
                  postType={postType}
                  adminOnly={config.adminOnlyComments}
              />
          )}

          {/* 이미지 확대 모달 */}
          {selectedImage && (
              <ImageModal
                  imageUrl={normalizeImageUrl(selectedImage)}
                  onClose={closeImageModal}
              />
          )}
        </div>
      </>
  );
};

export default PostDetail;