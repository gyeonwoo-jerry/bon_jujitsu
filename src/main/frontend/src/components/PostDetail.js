import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';
import Comment from './Comment';
import '../styles/postDetail.css';
import SubHeader from './SubHeader';

const PostDetail = () => {
  const params = useParams();
  const { branchId, boardId, noticeId, skillId, newsId, qnaId, sponsorId } = params;
  const location = useLocation();
  const navigate = useNavigate();
  const loggedNav = loggedNavigate(navigate);
  const fetchedRef = useRef(false);

  const [post, setPost] = useState(null);
  const [postType, setPostType] = useState(null); // 'board', 'notice', 'skill', 'news', 'qna', 'sponsor'
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [canEditState, setCanEditState] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null); // 'edit' 또는 'delete'

  // URL에서 게시물 타입과 ID 추출
  useEffect(() => {
    // 통합 라우트 처리: /detail/:postType/:postId 또는 /branches/:branchId/:postType/:postId

    // 1. 전역 게시물 상세: /detail/:postType/:postId (skill, news, qna, sponsor)
    if (params.postType && params.postId && !params.branchId &&
        location.pathname.startsWith('/detail/')) {
      const type = params.postType;
      const id = params.postId;

      if (['skill', 'news', 'qna', 'sponsor'].includes(type)) {
        if (id && id !== 'undefined') {
          setPostType(type);
          setPostId(id);
        } else {
          setError(`유효하지 않은 ${type === 'skill' ? '스킬' : type === 'news' ? '뉴스' : type === 'qna' ? 'QnA' : '제휴업체'} ID입니다.`);
          setLoading(false);
          return;
        }
      } else {
        setError('잘못된 게시글 타입입니다. 전역 게시물은 skill, news, qna 또는 sponsor만 가능합니다.');
        setLoading(false);
        return;
      }
    }
    // 2. 지부별 게시물 상세: /branches/:branchId/:postType/:postId
    else if (params.branchId && params.postType && params.postId) {
      const type = params.postType;
      const id = params.postId;

      if (['board', 'notice'].includes(type)) {
        setPostType(type);
        setPostId(id);
      } else {
        setError('잘못된 게시글 타입입니다. 지부 게시물은 board 또는 notice만 가능합니다.');
        setLoading(false);
        return;
      }
    }
    // 3. 하위 호환성 지원 (기존 라우트들)
    else if (location.pathname.includes('/skillDetail/')) {
      const skillIdFromPath = location.pathname.split('/skillDetail/')[1];
      if (skillIdFromPath && skillIdFromPath !== 'undefined') {
        setPostType('skill');
        setPostId(skillIdFromPath);
      } else {
        setError('유효하지 않은 스킬 ID입니다.');
        setLoading(false);
        return;
      }
    }
    else if (location.pathname.includes('/newsDetail/')) {
      const newsIdFromPath = location.pathname.split('/newsDetail/')[1];
      if (newsIdFromPath && newsIdFromPath !== 'undefined') {
        setPostType('news');
        setPostId(newsIdFromPath);
      } else {
        setError('유효하지 않은 뉴스 ID입니다.');
        setLoading(false);
        return;
      }
    }
    else if (location.pathname.includes('/qnaDetail/')) {
      const qnaIdFromPath = location.pathname.split('/qnaDetail/')[1];
      if (qnaIdFromPath && qnaIdFromPath !== 'undefined') {
        setPostType('qna');
        setPostId(qnaIdFromPath);
      } else {
        setError('유효하지 않은 QnA ID입니다.');
        setLoading(false);
        return;
      }
    }
    else if (location.pathname.includes('/sponsorDetail/')) {
      const sponsorIdFromPath = location.pathname.split('/sponsorDetail/')[1];
      if (sponsorIdFromPath && sponsorIdFromPath !== 'undefined') {
        setPostType('sponsor');
        setPostId(sponsorIdFromPath);
      } else {
        setError('유효하지 않은 제휴업체 ID입니다.');
        setLoading(false);
        return;
      }
    }
    // 4. 개별 파라미터 처리 (하위 호환성)
    else if (skillId) {
      setPostType('skill');
      setPostId(skillId);
    } else if (newsId) {
      setPostType('news');
      setPostId(newsId);
    } else if (qnaId) {
      setPostType('qna');
      setPostId(qnaId);
    } else if (sponsorId) {
      setPostType('sponsor');
      setPostId(sponsorId);
    } else if (boardId) {
      setPostType('board');
      setPostId(boardId);
    } else if (noticeId) {
      setPostType('notice');
      setPostId(noticeId);
    } else {
      setError('잘못된 접근입니다. 올바른 게시물 페이지에서 접근해주세요.');
      setLoading(false);
      return;
    }

    // fetchedRef 초기화
    fetchedRef.current = false;
    setCanEditState(false);
  }, [params, location.pathname]);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  // JWT 토큰에서 사용자 ID 추출하는 함수
  const getUserIdFromToken = () => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decodedPayload = JSON.parse(atob(payload));
      return decodedPayload.sub;
    } catch (error) {
      console.error('토큰 디코딩 실패:', error);
      return null;
    }
  };

  // 현재 사용자가 작성자인지 확인하는 함수
  const isAuthor = () => {
    if (!post) return false;

    // QnA에서 비로그인 상태면 일단 false 반환 (비밀번호로 나중에 검증)
    if (postType === 'qna' && !isLoggedIn()) {
      return false;
    }

    // 1. localStorage의 userInfo에서 id 가져오기
    const userInfoString = localStorage.getItem('userInfo');
    let userId = null;

    if (userInfoString) {
      const userInfo = JSON.parse(userInfoString);
      userId = userInfo.id;
    }

    // 2. userInfo에 id가 없으면 토큰에서 추출
    if (!userId) {
      userId = getUserIdFromToken();
    }

    if (!userId) {
      return false;
    }

    // 안전한 비교를 위해 문자열로 변환하여 비교
    return String(userId) === String(post.authorId);
  };

  // 관리자인지 확인하는 함수
  const isAdmin = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
  };

  // 지부 Owner인지 확인하는 함수 (공지사항용)
  const isBranchOwner = () => {
    if (postType !== 'notice') return false; // 공지사항이 아니면 체크하지 않음

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 모든 지부에 수정/삭제 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (Owner 역할만)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      return userInfo.branchRoles.some(branchRole => {
        const userBranchId = branchRole.branchId;
        const currentBranchId = branchId;
        const role = branchRole.role;

        const isSameBranch = String(userBranchId) === String(currentBranchId);
        const isOwnerRole = role === "OWNER";

        return isSameBranch && isOwnerRole;
      });
    }

    return false;
  };

  // 스킬 Owner인지 확인하는 함수 (스킬용)
  const isSkillOwner = () => {
    if (postType !== 'skill') return false; // 스킬이 아니면 체크하지 않음

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자는 모든 스킬에 수정/삭제 가능
    if (userInfo.isAdmin === true) {
      return true;
    }

    // 사용자의 지부 정보 확인 (Owner 역할만 - 어느 지부든)
    if (userInfo.branchRoles && Array.isArray(userInfo.branchRoles)) {
      return userInfo.branchRoles.some(branchRole => {
        const role = branchRole.role;
        return role === "OWNER";
      });
    }

    return false;
  };

  // 뉴스 편집 권한 확인 (관리자만)
  const canEditNews = () => {
    if (postType !== 'news') return false; // 뉴스가 아니면 체크하지 않음

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자만 뉴스 수정/삭제 가능
    return userInfo.isAdmin === true;
  };

  // 제휴업체 편집 권한 확인 (관리자만)
  const canEditSponsor = () => {
    if (postType !== 'sponsor') return false; // 제휴업체가 아니면 체크하지 않음

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // 관리자만 제휴업체 수정/삭제 가능
    return userInfo.isAdmin === true;
  };

  // 수정/삭제 권한 확인 - React 상태로 관리
  useEffect(() => {
    const checkEditPermission = () => {
      if (!post || !postType) {
        setCanEditState(false);
        return;
      }

      const loggedIn = isLoggedIn();
      const userIsAuthor = isAuthor();
      const userIsAdmin = isAdmin();

      let permission = false;

      if (postType === 'board') {
        permission = loggedIn && (userIsAuthor || userIsAdmin);
      } else if (postType === 'notice') {
        const userIsBranchOwner = isBranchOwner();
        permission = loggedIn && (userIsAuthor || userIsAdmin || userIsBranchOwner);
      } else if (postType === 'skill') {
        const userIsSkillOwner = isSkillOwner();
        permission = loggedIn && (userIsAuthor || userIsAdmin || userIsSkillOwner);
      } else if (postType === 'news') {
        const userCanEditNews = canEditNews();
        permission = loggedIn && (userIsAuthor || userIsAdmin || userCanEditNews);
      } else if (postType === 'sponsor') {
        const userCanEditSponsor = canEditSponsor();
        permission = loggedIn && (userIsAuthor || userIsAdmin || userCanEditSponsor);
      } else if (postType === 'qna') {
        // QnA 권한 로직
        if (userIsAdmin) {
          permission = true;
        } else if (loggedIn) {
          permission = userIsAuthor;
        } else {
          permission = true; // 비로그인은 항상 버튼 표시
        }
      }

      setCanEditState(permission);
    };

    checkEditPermission();
  }, [post, postType, branchId]);

  // localStorage 변경 감지 (로그인/로그아웃 시)
  useEffect(() => {
    const handleStorageChange = () => {
      if (post && postType) {
        const loggedIn = isLoggedIn();
        const userIsAuthor = isAuthor();
        const userIsAdmin = isAdmin();
        const userIsBranchOwner = isBranchOwner();
        const userIsSkillOwner = isSkillOwner();
        const userCanEditNews = canEditNews();
        const userCanEditSponsor = canEditSponsor();

        let permission = false;
        if (postType === 'notice') {
          permission = loggedIn && (userIsAuthor || userIsAdmin || userIsBranchOwner);
        } else if (postType === 'skill') {
          permission = loggedIn && (userIsAuthor || userIsAdmin || userIsSkillOwner);
        } else if (postType === 'news') {
          permission = loggedIn && (userIsAuthor || userIsAdmin || userCanEditNews);
        } else if (postType === 'sponsor') {
          permission = loggedIn && (userIsAuthor || userIsAdmin || userCanEditSponsor);
        } else if (postType === 'qna') {
          if (userIsAdmin) {
            permission = true;
          } else if (loggedIn) {
            permission = userIsAuthor;
          } else {
            permission = true; // 비로그인은 항상 버튼 표시
          }
        } else {
          permission = loggedIn && (userIsAuthor || userIsAdmin);
        }

        setCanEditState(permission);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [post, postType, branchId]);

  // 게시물 불러오기
  useEffect(() => {
    if (postType && postId) {
      // skill, news, qna, sponsor의 경우 branchId가 필요없음
      if (['skill', 'news', 'qna', 'sponsor'].includes(postType)) {
        // ID 유효성 검사
        if (!postId || postId === 'undefined' || isNaN(Number(postId))) {
          setError(`유효하지 않은 ${
              postType === 'skill' ? '스킬' :
                  postType === 'news' ? '뉴스' :
                      postType === 'qna' ? 'QnA' : '제휴업체'
          } ID입니다.`);
          setLoading(false);
          return;
        }
        fetchPostDetail();
      } else if (branchId) {
        // board, notice의 경우 branchId 필요
        if (!branchId || branchId === 'undefined' || isNaN(Number(branchId))) {
          setError('유효하지 않은 지부 ID입니다.');
          setLoading(false);
          return;
        }

        if (!postId || postId === 'undefined' || isNaN(Number(postId))) {
          setError('유효하지 않은 게시글 ID입니다.');
          setLoading(false);
          return;
        }

        fetchPostDetail();
      }
    }
  }, [branchId, postType, postId]);

  // API 엔드포인트 결정
  const getApiEndpoint = () => {
    if (postType === 'notice') return '/notice';
    if (postType === 'skill') return '/skill';
    if (postType === 'news') return '/news';
    if (postType === 'qna') return '/qna';
    if (postType === 'sponsor') return '/sponsor';
    return '/board';
  };

  // 게시물 타입에 따른 제목
  const getPageTitle = (title) => {
    let typeLabel = '';
    switch (postType) {
      case 'notice':
        typeLabel = '공지사항';
        break;
      case 'skill':
        typeLabel = '기술';
        break;
      case 'news':
        typeLabel = '뉴스';
        break;
      case 'qna':
        typeLabel = 'QnA';
        break;
      case 'sponsor':
        typeLabel = '제휴업체';
        break;
      default:
        typeLabel = '게시글';
    }
    return title ? `${title} - ${typeLabel} 상세` : `${typeLabel} 상세`;
  };

  const fetchPostDetail = async () => {
    // 중복 호출 방지
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setLoading(true);
      setError('');

      const apiEndpoint = getApiEndpoint();
      const response = await API.get(`${apiEndpoint}/${postId}`);

      if (response.data.success) {
        const postData = response.data.content;
        setPost(postData);

        // 페이지 제목 설정
        document.title = getPageTitle(postData.title);
      } else {
        setError(response.data.message || '게시글을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      console.error('API 에러:', err);
      if (err.response?.status === 404) {
        setError('존재하지 않는 게시글입니다.');
      } else if (err.response?.status === 403) {
        setError('게시글에 접근할 권한이 없습니다.');
      } else {
        setError('게시글을 불러오는데 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    if (postType === 'skill') {
      // 스킬 목록 페이지로 이동
      loggedNav('/skill');
    } else if (postType === 'news') {
      // 뉴스 목록 페이지로 이동
      loggedNav('/news');
    } else if (postType === 'qna') {
      // QnA 목록 페이지로 이동
      loggedNav('/qna');
    } else if (postType === 'sponsor') {
      // 제휴업체 목록 페이지로 이동
      loggedNav('/sponsor');
    } else {
      // 지부 상세 페이지로 이동
      loggedNav(`/branches/${branchId}`);
    }
  };

  const handleEditPost = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const loggedIn = isLoggedIn();
    const userIsAdmin = userInfo.isAdmin === true || userInfo.role === 'ADMIN';
    const userIsAuthor = isAuthor();

    // QnA인 경우 별도 처리
    if (postType === 'qna') {
      // 관리자 체크
      if (userIsAdmin) {
        loggedNav(`/edit/${postType}/${postId}`);
        return;
      }

      // 로그인한 회원이지만 작성자가 아닌 경우
      if (loggedIn && !userIsAuthor) {
        alert('본인이 작성한 글만 수정할 수 있습니다.');
        return;
      }

      // 비로그인인 경우 비밀번호 확인
      if (!loggedIn) {
        setPendingAction('edit');
        setShowPasswordModal(true);
        return;
      }

      // 작성자인 경우 수정 페이지로 이동
      loggedNav(`/edit/${postType}/${postId}`);
      return;
    }

    // Board/Notice인 경우
    if (postType === 'board' || postType === 'notice') {
      if (!loggedIn) {
        alert('로그인이 필요합니다.');
        return;
      }

      if (!userIsAuthor && !userIsAdmin) {
        alert('수정 권한이 없습니다.');
        return;
      }

      // 수정 페이지로 이동
      loggedNav(`/branches/${branchId}/${postType}/${postId}/edit`);
      return;
    }

    // 기타 (skill, news, sponsor 등) - 기존 로직
    if (!canEditState) {
      alert('수정 권한이 없습니다.');
      return;
    }

    if (!loggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 수정 페이지로 이동
    if (['skill', 'news', 'sponsor'].includes(postType)) {
      loggedNav(`/edit/${postType}/${postId}`);
    } else {
      loggedNav(`/branches/${branchId}/${postType}/${postId}/edit`);
    }
  };

  const handleDeletePost = async () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const loggedIn = isLoggedIn();
    const userIsAdmin = userInfo.isAdmin === true || userInfo.role === 'ADMIN';
    const userIsAuthor = isAuthor();

    // QnA인 경우 별도 처리
    if (postType === 'qna') {
      // 관리자 체크
      if (userIsAdmin) {
        await performDelete();
        return;
      }

      // 로그인한 회원이지만 작성자가 아닌 경우
      if (loggedIn && !userIsAuthor) {
        alert('본인이 작성한 글만 삭제할 수 있습니다.');
        return;
      }

      // 비로그인인 경우 비밀번호 확인
      if (!loggedIn) {
        setPendingAction('delete');
        setShowPasswordModal(true);
        return;
      }

      // 작성자인 경우 삭제 진행
      await performDelete();
      return;
    }

    // Board/Notice인 경우
    if (postType === 'board' || postType === 'notice') {
      if (!loggedIn) {
        alert('로그인이 필요합니다.');
        return;
      }

      if (!userIsAuthor && !userIsAdmin) {
        alert('삭제 권한이 없습니다.');
        return;
      }

      await performDelete();
      return;
    }

    // 기타 (skill, news, sponsor 등) - 기존 로직
    if (!canEditState) {
      alert('삭제 권한이 없습니다.');
      return;
    }

    if (!loggedIn) {
      alert('로그인이 필요합니다.');
      return;
    }

    await performDelete();
  };

  // 실제 삭제 수행 - 비회원 비밀번호 처리 추가
  const performDelete = async (guestPassword = null) => {
    let typeLabel = '';
    switch (postType) {
      case 'notice':
        typeLabel = '공지사항';
        break;
      case 'skill':
        typeLabel = '기술';
        break;
      case 'news':
        typeLabel = '뉴스';
        break;
      case 'qna':
        typeLabel = 'QnA';
        break;
      case 'sponsor':
        typeLabel = '제휴업체';
        break;
      default:
        typeLabel = '게시글';
    }

    if (window.confirm(`정말로 이 ${typeLabel}을 삭제하시겠습니까?`)) {
      try {
        const apiEndpoint = getApiEndpoint();

        let response;

        // QnA 비회원 삭제의 경우 비밀번호와 함께 요청
        if (postType === 'qna' && guestPassword) {
          // 백엔드 API에 맞춰 비밀번호를 쿼리 파라미터나 요청 바디로 전달
          // 방법 1: 쿼리 파라미터로 전달
          response = await API.delete(`${apiEndpoint}/${postId}?guestPassword=${encodeURIComponent(guestPassword)}`);

          // 방법 2: 요청 바디로 전달 (백엔드 구현에 따라 선택)
          // response = await API.delete(`${apiEndpoint}/${postId}`, {
          //   data: { guestPassword: guestPassword }
          // });
        } else {
          // 일반 삭제
          response = await API.delete(`${apiEndpoint}/${postId}`);
        }

        if (response.data.success) {
          alert(`${typeLabel}이 삭제되었습니다.`);
          // 삭제 완료 후 목록 페이지로 이동
          handleBackToList();
        } else {
          alert(response.data.message || `${typeLabel} 삭제에 실패했습니다.`);
        }
      } catch (err) {
        console.error('삭제 에러:', err);
        if (err.response?.status === 403) {
          alert('삭제 권한이 없습니다.');
        } else if (err.response?.status === 400) {
          alert(err.response.data?.message || '비밀번호가 일치하지 않습니다.');
        } else {
          alert(`${typeLabel} 삭제에 실패했습니다.`);
        }
      }
    }
  };

  // 비밀번호 확인
  const handlePasswordConfirm = async () => {
    if (!passwordInput.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    try {
      if (pendingAction === 'edit') {
        // 수정의 경우 기존 로직 유지 (비밀번호 검증 후 페이지 이동)
        const response = await API.post(`/qna/${postId}/verify-password`, {
          guestPassword: passwordInput
        });

        if (response.data.success) {
          setShowPasswordModal(false);
          setPasswordInput('');
          // 수정 페이지로 이동
          loggedNav(`/edit/qna/${postId}`);
          setPendingAction(null);
        } else {
          alert('비밀번호가 일치하지 않습니다.');
          setPasswordInput('');
        }
      } else if (pendingAction === 'delete') {
        // 삭제의 경우 비밀번호를 직접 전달
        setShowPasswordModal(false);
        const password = passwordInput;
        setPasswordInput('');
        setPendingAction(null);

        // 비밀번호와 함께 삭제 수행
        await performDelete(password);
      }
    } catch (error) {
      console.error('비밀번호 확인 오류:', error);

      // 백엔드에서 IllegalArgumentException으로 오는 에러 처리
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else if (error.response?.status === 400) {
        alert('비밀번호가 일치하지 않습니다.');
      } else {
        alert('비밀번호 확인 중 오류가 발생했습니다.');
      }
      setPasswordInput('');
    }
  };

  // 비밀번호 모달 닫기
  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPendingAction(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // QnA 작성자 정보 (회원/비회원 구분)
  const getQnaAuthor = () => {
    if (postType !== 'qna') return post.author;

    // 백엔드에서 authorName 필드로 통합해서 보내주므로 이를 우선 사용
    if (post.authorName) {
      return post.authorName;
    }

    // fallback 로직
    if (post.guestName) {
      return post.guestName;
    }

    if (post.author) {
      return post.author;
    }

    return '익명';
  };

  if (loading) {
    return (
        <div className="board-detail-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>게시글을 불러오는 중...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="board-detail-container">
          <div className="error-message">
            <h3>오류가 발생했습니다</h3>
            <p>{error}</p>
            <button onClick={handleBackToList} className="btn-secondary">
              목록으로 돌아가기
            </button>
          </div>
        </div>
    );
  }

  if (!post) {
    return (
        <div className="board-detail-container">
          <div className="error-message">
            <h3>게시글을 찾을 수 없습니다</h3>
            <button onClick={handleBackToList} className="btn-secondary">
              목록으로 돌아가기
            </button>
          </div>
        </div>
    );
  }

  let typeLabel = '';
  switch (postType) {
    case 'notice':
      typeLabel = '공지사항';
      break;
    case 'skill':
      typeLabel = '기술';
      break;
    case 'news':
      typeLabel = '뉴스';
      break;
    case 'qna':
      typeLabel = 'QnA';
      break;
    case 'sponsor':
      typeLabel = '제휴업체';
      break;
    default:
      typeLabel = '게시글';
  }

  return (
      <>
        {/* 스킬, 뉴스, QnA일 때만 SubHeader 렌더링 (sponsor 제외) */}
        {(['skill', 'news', 'qna'].includes(postType)) && (
            <SubHeader
                pageName={
                  postType === 'skill' ? '기술 상세' :
                      postType === 'news' ? '뉴스 상세' : 'QnA 상세'
                }
                descName={
                  postType === 'skill' ? "본주짓수 기술을 확인해보세요" :
                      postType === 'news' ? "본주짓수 최신 소식을 확인해보세요" :
                          "본주짓수 QnA를 확인해보세요"
                }
            />
        )}

        <div className={`board-detail-container ${postType}-detail`}>
          <div className="board-detail-header">
            <button onClick={handleBackToList} className="btn-back">
              ← 목록으로
            </button>
            {/* 수정/삭제 버튼 표시 조건 */}
            {(() => {
              const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
              const loggedIn = isLoggedIn();
              const userIsAdmin = userInfo.isAdmin === true || userInfo.role === 'ADMIN';
              const userIsAuthor = isAuthor();

              if (postType === 'qna') {
                // QnA인 경우
                if (userIsAdmin) {
                  return true; // 관리자는 항상 표시
                } else if (loggedIn) {
                  return userIsAuthor; // 로그인 회원은 본인 글만 표시
                } else {
                  return true; // 비로그인은 항상 표시 (비밀번호로 검증)
                }
              } else if (postType === 'board') {
                // Board인 경우: 작성자 본인 또는 관리자
                return loggedIn && (userIsAuthor || userIsAdmin);
              } else if (postType === 'notice') {
                // Notice인 경우: 작성자 본인 또는 관리자
                return loggedIn && (userIsAuthor || userIsAdmin);
              } else if (postType === 'skill') {
                // 기존 스킬 로직 유지
                return canEditState;
              } else if (postType === 'news') {
                // 기존 뉴스 로직 유지
                return canEditState;
              } else if (postType === 'sponsor') {
                // 제휴업체: 관리자만
                return canEditState;
              } else {
                // 기타
                return canEditState;
              }
            })() && (
                <div className="board-actions">
                  <button onClick={handleEditPost} className="btn-edit">
                    수정
                  </button>
                  <button onClick={handleDeletePost} className="btn-delete">
                    삭제
                  </button>
                </div>
            )}
          </div>

          <div className="board-detail-content">
            <div className="board-header">
              <h1 className="board-title">{post.title}</h1>
              <div className="board-meta">
                <div className="board-meta-left">
                  <span className="author">
                    작성자: {postType === 'qna' ? getQnaAuthor() : post.author}
                    {postType === 'qna' && post.guestName && (
                        <span className="guest-badge">비회원</span>
                    )}
                  </span>
                  {post.region && <span className="region">지역: {post.region}</span>}
                  <span className="post-type">{typeLabel}</span>
                </div>
                <div className="board-meta-right">
                  <span className="date">작성일: {formatDate(post.createdAt)}</span>
                  {postType !== 'qna' && (
                      <span className="views">조회수: {post.viewCount?.toLocaleString()}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="board-content">
              <div className="content-text">
                {post.content.split('\n').map((line, index) => (
                    <p key={index}>{line}</p>
                ))}
              </div>

              {/* 제휴업체 특별 정보 표시 */}
              {postType === 'sponsor' && post.url && (
                  <div className="sponsor-website-info">
                    <h4>웹사이트</h4>
                    <a
                        href={post.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sponsor-website-link"
                    >
                      🌐 {post.url}
                    </a>
                  </div>
              )}

              {post.images && post.images.length > 0 && (
                  <div className="board-images">
                    <h4>첨부 이미지</h4>
                    <div className="image-grid">
                      {post.images.map((image, index) => (
                          <div key={image.id || index} className="image-item">
                            <img
                                src={image.url}
                                alt={`첨부 이미지 ${index + 1}`}
                                onClick={() => openImageModal(image.url)}
                                className="board-image"
                            />
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            {post.modifiedAt && post.modifiedAt !== post.createdAt && (
                <div className="board-modified">
                  <small>마지막 수정: {formatDate(post.modifiedAt)}</small>
                </div>
            )}
          </div>

          {/* 댓글 섹션 */}
          {postType === 'qna' ? (
              // QnA의 경우 관리자만 댓글(답변) 작성 가능
              <Comment
                  postId={postId}
                  postType="qna"
                  adminOnly={true}
              />
          ) : !(['skill', 'news', 'sponsor'].includes(postType)) && (
              // 스킬, 뉴스, 제휴업체가 아닐 때만 일반 댓글 표시
              <Comment postId={postId} postType={postType}/>
          )}

          {/* 비밀번호 확인 모달 */}
          {showPasswordModal && (
              <div className="password-modal-overlay" onClick={handlePasswordModalClose}>
                <div className="password-modal" onClick={(e) => e.stopPropagation()}>
                  <h3>비밀번호 확인</h3>
                  <p>작성시 입력한 비밀번호를 입력해주세요.</p>
                  <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="비밀번호를 입력하세요"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handlePasswordConfirm();
                        }
                      }}
                      autoFocus
                  />
                  <div className="password-modal-actions">
                    <button onClick={handlePasswordConfirm} className="btn-confirm">
                      확인
                    </button>
                    <button onClick={handlePasswordModalClose} className="btn-cancel">
                      취소
                    </button>
                  </div>
                </div>
              </div>
          )}

          {/* 이미지 모달 */}
          {selectedImage && (
              <div className="image-modal" onClick={closeImageModal}>
                <div className="image-modal-content"
                     onClick={(e) => e.stopPropagation()}>
                  <img src={selectedImage} alt="확대된 이미지"/>
                  <button className="modal-close" onClick={closeImageModal}>
                    ×
                  </button>
                </div>
              </div>
          )}
        </div>
      </>
  );
};

export default PostDetail;