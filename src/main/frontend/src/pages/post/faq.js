import React, {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import SubHeader from '../../components/SubHeader';
import {usePostList} from '../../hooks/usePostList';
import {usePostPermissions} from '../../hooks/usePostPermissions';
import Pagination from '../../components/common/Pagination';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import '../../styles/faq.css';
import '../../styles/postList.css';
import API from "../../utils/api";

function Faq() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [expandedItems, setExpandedItems] = useState(new Set());
  const navigate = useNavigate();

  // 권한 체크를 위한 훅 (관리자 확인용)
  const { isAdmin, isLoggedIn } = usePostPermissions('faq', null, null);

  // 관리자이면서 로그인한 상태인지 확인
  const isLoggedInAdmin = () => {
    // 직접 체크해보기
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

    const loggedIn = !!token;
    const admin = userInfo.role === 'ADMIN' || userInfo.isAdmin === true;

    // 디버깅용 로그
    console.log('FAQ 권한 체크:', {
      token: !!token,
      userInfo: userInfo,
      loggedIn: loggedIn,
      admin: admin,
      result: loggedIn && admin
    });

    return loggedIn && admin;
  };

  // 추가 디버깅: usePostPermissions의 isAdmin 함수도 확인
  console.log('usePostPermissions isAdmin():', isAdmin());
  console.log('usePostPermissions isLoggedIn():', isLoggedIn());

  // PostList 로직을 usePostList 훅으로 대체 (기존 QnA API 활용)
  const {
    posts,
    loading,
    error,
    currentPage,
    totalPages,
    totalElements,
    handlePageChange,
    fetchPosts
  } = usePostList('/qna', 10); // API 엔드포인트는 qna 유지

  useEffect(() => {
    const title = 'FAQ';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수에 대한 자주 묻는 질문들을 확인해보세요.';
    setDescName(descName);
    const backgroundImage = '';
    setBackgroundImage(backgroundImage);
  }, []);

  // FAQ 답변 내용 가져오기 - 기존 QnA 답변 활용
  const getFaqAnswer = (post) => {
    // 기존 QnA에서 답변이 있는 경우 해당 답변 사용
    if (post.answer) return post.answer;
    if (post.content) return post.content;
    if (post.hasAnswer && post.answerContent) return post.answerContent;
    return '답변이 준비 중입니다.';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';

    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const toggleExpanded = (postId) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedItems(newExpanded);
  };

  const handleItemClick = (post) => {
    if (!post.id) {
      console.error('게시글 ID가 없습니다:', post);
      return;
    }
    toggleExpanded(post.id);
  };

  // 관리자 기능들
  const handleAdminWriteClick = () => {
    navigate('/write/faq'); // FAQ 작성 페이지로 변경
  };

  const handleEditClick = (post, e) => {
    e.stopPropagation(); // 아코디언 토글 방지
    navigate(`/edit/faq/${post.id}`); // FAQ 수정 페이지로 변경
  };

  const handleDeleteClick = async (post, e) => {
    e.stopPropagation(); // 아코디언 토글 방지

    if (window.confirm('이 FAQ를 삭제하시겠습니까?')) {
      try {
        // PostDetail.js처럼 API 유틸리티 사용
        const response = await API.delete(`/qna/${post.id}`);

        if (response.data.success) {
          alert('FAQ가 삭제되었습니다.');
          fetchPosts(); // 목록 새로고침
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
    }
  };

  return (
      <div className="faq">
        <SubHeader pageName={pageName} descName={descName} backgroundImage={backgroundImage} />
        <div className="faq-container">
          <div className="inner">
            <div className="faq-list-container">
              {loading && <LoadingSpinner message="FAQ를 불러오는 중..." />}
              {error && <ErrorMessage message={error} onRetry={fetchPosts} />}

              {posts.length > 0 ? (
                  <>
                    <div className="faq-items">
                      {posts.map((post, index) => (
                          <div
                              key={post.id}
                              className={`faq-item ${expandedItems.has(post.id) ? 'expanded' : ''}`}
                          >
                            <div
                                className="faq-question"
                                onClick={() => handleItemClick(post)}
                            >
                              <div className="question-content">
                                <span className="question-number">Q{(currentPage - 1) * 10 + index + 1}.</span>
                                <span className="question-text">{post.title}</span>
                                <div className="question-meta">
                                  <span className="question-date">{formatDate(post.createdAt)}</span>
                                  {post.images && post.images.length > 0 && (
                                      <span className="image-icon">📷</span>
                                  )}
                                </div>
                              </div>
                              <div className="question-actions">
                                {isAdmin() && (
                                    <div className="admin-actions" onClick={(e) => e.stopPropagation()}>
                                      <button
                                          className="edit-btn"
                                          onClick={(e) => handleEditClick(post, e)}
                                          title="수정"
                                      >
                                        ✏️
                                      </button>
                                      <button
                                          className="delete-btn"
                                          onClick={(e) => handleDeleteClick(post, e)}
                                          title="삭제"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                )}
                                <div className="expand-icon">
                                  {expandedItems.has(post.id) ? '−' : '+'}
                                </div>
                              </div>
                            </div>

                            {expandedItems.has(post.id) && (
                                <div className="faq-answer">
                                  <div className="answer-label">A.</div>
                                  <div className="answer-content">
                                    <div className="answer-text">
                                      {getFaqAnswer(post)}
                                    </div>
                                    <div className="answer-meta">
                                      {post.updatedAt && post.updatedAt !== post.createdAt && (
                                          <span className="answer-date">수정: {formatDate(post.updatedAt)}</span>
                                      )}
                                    </div>
                                    {post.images && post.images.length > 0 && (
                                        <div className="answer-images">
                                          {post.images.map((image, imgIndex) => (
                                              <img
                                                  key={imgIndex}
                                                  src={image.url}
                                                  alt={`FAQ 이미지 ${imgIndex + 1}`}
                                                  className="answer-image"
                                              />
                                          ))}
                                        </div>
                                    )}
                                  </div>
                                </div>
                            )}
                          </div>
                      ))}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />

                    <div className="total-info">
                      전체 {totalElements}개의 질문 (페이지 {currentPage}/{totalPages})
                    </div>
                  </>
              ) : (
                  <div className="no-posts">
                    <div className="no-posts-icon">❓</div>
                    <p>등록된 FAQ가 없습니다.</p>
                  </div>
              )}
            </div>

            {/* 관리자용 FAQ 추가 버튼 */}
            {isAdmin() && (
                <button className="admin-write-button" onClick={handleAdminWriteClick}>
                  FAQ 추가
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

export default Faq;