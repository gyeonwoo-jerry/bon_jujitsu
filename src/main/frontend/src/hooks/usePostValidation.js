// 📁 src/hooks/usePostValidation.js (최종 수정 버전)
import { POST_TYPE_CONFIGS } from '../configs/postTypeConfigs';

const isValidUrl = (string) => {
  try {
    const urlToTest = string.startsWith('http://') || string.startsWith('https://')
        ? string
        : 'https://' + string;
    new URL(urlToTest);
    return true;
  } catch (_) {
    return false;
  }
};

export const usePostValidation = (postType) => {
  const config = POST_TYPE_CONFIGS[postType];

  const validateForm = (formData) => {
    // ✅ config 체크 추가 (중요!)
    if (!config) {
      return { isValid: false, error: '잘못된 게시글 타입입니다.' };
    }

    const { validation } = config;

    if (!formData.title.trim()) {
      return { isValid: false, error: '제목을 입력해주세요.' };
    }

    if (formData.title.length > validation.titleMaxLength) {
      return { isValid: false, error: `제목은 ${validation.titleMaxLength}자 이하로 입력해주세요.` };
    }

    if (!formData.content.trim()) {
      return { isValid: false, error: '내용을 입력해주세요.' };
    }

    if (formData.content.length > validation.contentMaxLength) {
      return { isValid: false, error: `내용은 ${validation.contentMaxLength}자 이하로 입력해주세요.` };
    }

    // ✅ QnA 비회원 검증 수정 (isGuestPost로 변경)
    if (postType === 'qna' && formData.isGuestPost) {
      if (!formData.guestName?.trim()) {
        return { isValid: false, error: '이름을 입력해주세요.' };
      }

      if (!formData.guestPassword || formData.guestPassword.length < validation.guestPasswordMinLength) {
        return { isValid: false, error: `비밀번호는 ${validation.guestPasswordMinLength}자 이상 입력해주세요.` };
      }
    }

    // ✅ 스킬 전용 검증 추가
    if (postType === 'skill') {
      if (!formData.position) {
        return { isValid: false, error: '포지션을 선택해주세요.' };
      }

      if (!formData.skillType) {
        return { isValid: false, error: '기술 타입을 선택해주세요.' };
      }
    }

    // ✅ Sponsor URL 검증 개선 (빈 문자열 체크 추가)
    if (postType === 'sponsor' && formData.url && formData.url.trim()) {
      if (!isValidUrl(formData.url.trim())) {
        return { isValid: false, error: '올바른 URL 형식을 입력해주세요.' };
      }
    }

    return { isValid: true, error: null };
  };

  return { validateForm };
};