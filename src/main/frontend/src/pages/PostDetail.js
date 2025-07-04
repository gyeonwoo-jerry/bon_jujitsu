import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { POST_TYPE_CONFIGS } from '../configs/postTypeConfigs';
import { usePostData } from '../hooks/usePostData';
import { usePostPermissions } from '../hooks/usePostPermissions';
import API from '../utils/api';
import '../styles/postDetail.css';

import SubHeader from '../components/SubHeader';
import PostDetailHeader from '../components/detail/PostDetailHeader';
import PostDetailContent from '../components/detail/PostDetailContent';
import PostDetailMeta from '../components/detail/PostDetailMeta';
import Comment from '../components/Comment';
import PasswordModal from '../components/modals/PasswordModal';
import ImageModal from '../components/modals/ImageModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

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

  // 액션 관련 상태들
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // UI 상태
  const [selectedImage, setSelectedImage] = useState(null);

  // 수정 버튼 클릭 핸들러
  const handleEdit = () => {
    // QnA 비회원 게시글인 경우 비밀번호 확인 필요
    if (postType === 'qna' && post.isGuestPost && !isLoggedIn()) {
      setPendingAction('edit');
      setShowPasswordModal(true);
      return;
    }

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
    // QnA 비회원 게시글인 경우 비밀번호 확인 필요
    if (postType === 'qna' && post.isGuestPost && !isLoggedIn()) {
      setPendingAction('delete');
      setShowPasswordModal(true);
      return;
    }

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

  // 비밀번호 확인 후 액션 수행
  const handlePasswordConfirm = async () => {
    if (!passwordInput.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      if (pendingAction === 'edit') {
        // 비밀번호 검증을 위한 API 호출
        const response = await API.post(`/qna/${postId}/verify-password`, {
          guestPassword: passwordInput  // PasswordRequest에 맞는 필드명 사용
        });

        if (response.data.success) {
          // 비밀번호 검증 성공 - 수정 페이지로 이동
          // 임시로 sessionStorage에 검증 상태 저장
          sessionStorage.setItem(`verified_${postId}`, 'true');
          navigate(`/edit/${postType}/${postId}`);
        } else {
          throw new Error(response.data.message || '비밀번호가 일치하지 않습니다.');
        }
      } else if (pendingAction === 'delete') {
        // 삭제의 경우 기존 로직 유지
        const config = POST_TYPE_CONFIGS[postType];
        const response = await API.delete(`${config.apiEndpoint}/${postId}`, {
          params: { guestPassword: passwordInput }  // 쿼리 파라미터로 전송
        });

        if (response.data.success) {
          alert('게시글이 삭제되었습니다.');
          handleBackToList();
        } else {
          throw new Error(response.data.message || '삭제에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('액션 수행 오류:', error);
      alert(error.response?.data?.message || '작업에 실패했습니다.');
    }

    handlePasswordModalClose();
  };

  // 비밀번호 모달 닫기
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPendingAction(null);
  };

  // QnA 게시판의 수정/삭제 버튼 노출 조건
  const shouldShowQnAButtons = () => {
    if (!post) return false;

    // 관리자는 항상 버튼 노출
    if (isAdmin()) return true;

    // 비회원 게시글인 경우
    if (post.isGuestPost) {
      // 로그인하지 않은 상태에서만 버튼 노출 (비밀번호 검증을 위해)
      return !isLoggedIn();
    }

    // 회원 게시글인 경우 - 본인이 작성한 글만 버튼 노출
    return isAuthor();
  };

  // 다른 게시판의 수정/삭제 버튼 노출 조건
  const shouldShowButtons = () => {
    if (postType === 'qna') {
      return shouldShowQnAButtons();
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
      case 'qna':
        navigate('/qna');
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
        {(['skill', 'news', 'qna'].includes(postType)) && (
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

          {/* 비밀번호 확인 모달 */}
          {showPasswordModal && (
              <PasswordModal
                  show={showPasswordModal}
                  passwordInput={passwordInput}
                  onPasswordChange={setPasswordInput}
                  onConfirm={handlePasswordConfirm}
                  onClose={handlePasswordModalClose}
                  action={pendingAction}
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