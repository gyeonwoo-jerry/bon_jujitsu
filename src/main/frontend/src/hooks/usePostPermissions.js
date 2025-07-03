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
    // 🔥 QnA 비회원 게시글 수정 권한 특별 처리
    if (postType === 'qna' && post && (post.guestName || post.isGuestPost)) {
      // QnA 비회원 게시글은 관리자만 수정 가능
      // 실제 비밀번호 검증은 서버에서 처리됨
      return isAdmin() || true; // 👈 비회원도 수정 페이지 접근 허용 (비밀번호는 서버에서 검증)
    }

    // 일반적인 수정 권한 체크
    if (isAdmin()) return true;
    if (isAuthor()) return true;
    if (config.permissions.includes('BRANCH_OWNER') && isBranchOwner()) return true;

    return false;
  };

  return { canWrite, canEdit, isLoggedIn, isAdmin, isAuthor };
};