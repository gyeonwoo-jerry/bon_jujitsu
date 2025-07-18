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
    // config가 없는 경우 기본값 처리
    if (!config) {
      console.error(`POST_TYPE_CONFIGS에서 "${postType}" 타입을 찾을 수 없습니다.`);
      return false;
    }

    const permissions = config.permissions;

    // FAQ는 관리자만 작성 가능
    if (postType === 'faq') {
      return isAdmin();
    }

    // 권한 체크 로직 개선
    // 1. 관리자 권한이 있고 관리자인 경우
    if (permissions.includes('ADMIN') && isAdmin()) return true;

    // 2. 비회원 허용이고 비회원인 경우
    if (permissions.includes('GUEST') && config.allowGuest) return true;

    // 3. 지부 소유자 권한이 있고 지부 소유자인 경우
    if (permissions.includes('BRANCH_OWNER') && isBranchOwner()) return true;

    // 4. 작성자 권한이 있고 로그인한 경우
    if (permissions.includes('AUTHOR') && isLoggedIn()) return true;

    // 5. 지부 멤버 권한이 있고 로그인한 경우
    if (permissions.includes('BRANCH_MEMBER') && isLoggedIn()) return true;

    // 위 조건들에 해당하지 않으면 작성 불가
    return false;
  };

  const canEdit = () => {
    // config가 없는 경우 기본값 처리
    if (!config) {
      return false;
    }

    // 로그인하지 않은 경우 수정 불가
    if (!isLoggedIn()) {
      return false;
    }

    // 관리자는 모든 글 수정 가능
    if (isAdmin()) return true;

    // FAQ 게시판은 관리자만 수정 가능
    if (postType === 'faq') {
      return false; // 관리자가 아니면 수정 불가
    }

    // Notice 게시판은 브런치 관장도 수정 가능
    if (postType === 'notice') {
      if (isAuthor()) return true;
      if (config.permissions.includes('BRANCH_OWNER') && isBranchOwner()) return true;
      return false;
    }

    // 나머지 게시판들은 작성자만 수정 가능 (브런치 관장 권한 제거)
    if (isAuthor()) return true;

    return false;
  };

  const canDelete = () => {
    // 삭제 권한은 수정 권한과 동일하게 처리
    return canEdit();
  };

  // FAQ 게시판 전용 버튼 노출 체크 함수 (간소화)
  const shouldShowFaqButtons = () => {
    if (!post) return false;

    // FAQ는 관리자만 수정/삭제 가능
    if (postType === 'faq') {
      return isAdmin();
    }

    // 다른 게시판은 기존 로직 유지
    return canEdit();
  };

  return {
    canWrite,
    canEdit,
    canDelete,
    shouldShowFaqButtons, // QnA에서 FAQ로 변경
    isLoggedIn,
    isAdmin,
    isAuthor
  };
};