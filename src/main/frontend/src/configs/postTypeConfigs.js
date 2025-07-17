export const POST_TYPE_CONFIGS = {
  skill: {
    title: '기술 게시물',
    apiEndpoint: '/skill',
    allowGuest: false,
    showRegion: true,
    showViewCount: true,
    showComments: false,
    permissions: ['ADMIN', 'OWNER'],
    customFields: [],
    validation: {
      titleMaxLength: 100,
      contentMaxLength: 5000
    }
  },
  faq: {
    title: 'FAQ', // QnA를 완전히 FAQ로 대체
    apiEndpoint: '/qna', // API는 기존 qna 엔드포인트 사용
    allowGuest: false,
    showRegion: false,
    showViewCount: false,
    showComments: false,
    adminOnlyComments: false,
    permissions: ['ADMIN'], // 관리자만 작성 가능
    customFields: [],
    validation: {
      titleMaxLength: 100,
      contentMaxLength: 5000
    }
  },
  sponsor: {
    title: '제휴업체',
    apiEndpoint: '/sponsor',
    allowGuest: false,
    showRegion: true,
    showViewCount: true,
    showComments: false,
    permissions: ['ADMIN'],
    customFields: ['url'],
    validation: {
      titleMaxLength: 100,
      contentMaxLength: 5000,
      urlRequired: false
    }
  },
  news: {
    title: '뉴스',
    apiEndpoint: '/news',
    allowGuest: false,
    showRegion: false,
    showViewCount: true,
    showComments: false,
    permissions: ['ADMIN'],
    customFields: [],
    validation: {
      titleMaxLength: 100,
      contentMaxLength: 5000
    }
  },
  board: {
    title: '게시글',
    apiEndpoint: '/board',
    allowGuest: false,
    showRegion: true,
    showViewCount: true,
    showComments: true,
    permissions: ['ADMIN', 'AUTHOR', 'BRANCH_MEMBER'],
    customFields: [],
    validation: {
      titleMaxLength: 100,
      contentMaxLength: 5000
    }
  },
  notice: {
    title: '공지사항',
    apiEndpoint: '/notice',
    allowGuest: false,
    showRegion: true,
    showViewCount: true,
    showComments: true,
    permissions: ['ADMIN', 'AUTHOR', 'BRANCH_OWNER'],
    customFields: [],
    validation: {
      titleMaxLength: 100,
      contentMaxLength: 5000
    }
  }
};

// URL 유효성 검증 함수
export const isValidUrl = (string) => {
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

// URL 정규화 함수 (프로토콜 자동 추가)
export const normalizeUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return 'https://' + url;
};