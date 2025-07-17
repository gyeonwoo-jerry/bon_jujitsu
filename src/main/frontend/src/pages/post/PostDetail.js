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

  // 수정 버튼 클릭 핸들러
  const handleEdit = () => {
    // 직접 수정 페이지로 이동
    let editPath;
    switch (postType) {
      case 'notice':
      case 'board':
        editPath = `/branches/${branchId}/${postType}/${postId}/edit`;
        break;
      default:
        editPath = `/edit/${postType}/${postId}`;
        break;
    }
    navigate(editPath);
  };

  // 삭제 버튼 클릭 핸들러
  const handleDelete = () => {
    // 직접 삭제 확인
    if (window.confirm('정말로 삭제하시겠습니까?')) {
      performDelete();
    }
  };

  // 실제 삭제 수행
  const performDelete = async () => {
    try {
      const config = POST_TYPE_CONFIGS[postType];
      const response = await API.delete(`${config.apiEndpoint}/${postId}`);

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
    if (postType === 'faq') {
      return isAdmin(); // FAQ는 관리자만 수정/삭제 가능
    }
    // 다른 게시판들은 기존 권한 체크 로직 사용
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
      case 'notice':
      case 'board':
        navigate(`/branches/${branchId}`);
        break;
      default:
        navigate('/');
        break;
    }
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
  if (error || !post) {
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
        {(['skill', 'news', 'faq'].includes(postType)) && (
            <SubHeader
                pageName={`${config.title} 상세`}
                descName={`본주짓수 ${config.title}를 확인해보세요`}
            />
        )}

        <div className={`board-detail-container ${postType}-detail`}>
          {/* 헤더 (뒤로가기, 수정/삭제 버튼) */}
          <PostDetailHeader
              postType={postType}
              post={post}
              canEdit={shouldShowButtons}
              onBack={handleBackToList}
              onEdit={handleEdit}
              onDelete={handleDelete}
          />

          <div className="board-detail-content">
            {/* 메타 정보 (제목, 작성자, 날짜 등) */}
            <PostDetailMeta
                post={post}
                postType={postType}
                config={config}
            />

            {/* 본문 내용 */}
            <PostDetailContent
                post={post}
                postType={postType}
                onImageClick={openImageModal}
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
                  imageUrl={selectedImage}
                  onClose={closeImageModal}
              />
          )}
        </div>
      </>
  );
};

export default PostDetail;