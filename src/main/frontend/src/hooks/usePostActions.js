import { POST_TYPE_CONFIGS } from '../configs/postTypeConfigs';

export const usePostPermissions = (postType, post, branchId) => {
  const config = POST_TYPE_CONFIGS[postType];

  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  const isAdmin = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
  };

  const isAuthor = () => {
    if (!post) return false;

    // QnA 비회원 작성의 경우는 작성자 확인 불가
    if (postType === 'qna' && (post.guestName || post.isGuestPost)) {
      return false;
    }

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return String(userInfo.id) === String(post.authorId);
  };

  const isBranchOwner = () => {
    if (!branchId) return false;
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    if (userInfo.isAdmin) return true;

    return userInfo.branchRoles?.some(role =>
        String(role.branchId) === String(branchId) && role.role === 'OWNER'
    );
  };

  const canWrite = () => {
    const permissions = config.permissions;

    if (permissions.includes('ADMIN') && isAdmin()) return true;
    if (permissions.includes('GUEST') && config.allowGuest) return true;
    if (permissions.includes('BRANCH_OWNER') && isBranchOwner()) return true;

    return isLoggedIn();
  };

  const canEdit = () => {
    // 관리자는 모든 글 수정 가능
    if (isAdmin()) return true;

    // QnA 게시판 특별 처리
    if (postType === 'qna') {
      if (post && post.isGuestPost) {
        // 비회원 게시글은 로그인한 일반 회원이 수정할 수 없음
        if (isLoggedIn()) {
          return false; // 로그인한 회원은 비회원 글 수정 불가
        }
        // 비회원(미로그인 상태)은 비밀번호 검증을 통해 수정 가능
        return true;
      }
      // QnA 회원 게시글은 작성자만 수정 가능
      return isAuthor();
    }

    // 다른 게시판들의 경우
    if (isAuthor()) return true;
    if (config.permissions.includes('BRANCH_OWNER') && isBranchOwner()) return true;

    return false;
  };

  const canDelete = () => {
    // 삭제 권한은 수정 권한과 동일하게 처리
    return canEdit();
  };

  return {
    canWrite,
    canEdit,
    canDelete,
    isLoggedIn,
    isAdmin,
    isAuthor
  };
};