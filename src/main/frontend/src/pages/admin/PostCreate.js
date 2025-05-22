// pages/admin/PostCreate.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import '../../styles/admin/postForm.css';

const PostCreate = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // URL 쿼리 파라미터에서 카테고리 가져오기
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    const categoryParam = params.get('category');
    return categoryParam || 'skill';
  };

  // 카테고리 정보
  const [categories] = useState([
    { id: 'skill', name: 'Skill', apiPath: '/skill' },
    { id: 'sponsor', name: 'Sponsor', apiPath: '/sponsor' },
    { id: 'news', name: 'News', apiPath: '/news' }
  ]);

  // 폼 상태
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  // 권한 체크
  useEffect(() => {
    if (!checkToken()) {
      navigate('/login');
      return;
    }

    // ADMIN 권한 체크
    const userInfo = localStorage.getItem("userInfo");
    if (userInfo) {
      try {
        const user = JSON.parse(userInfo);
        const role = user.role || "";

        if (role !== "ADMIN") {
          alert("관리자만 게시글을 등록할 수 있습니다.");
          navigate('/admin');
          return;
        }
      } catch (error) {
        console.error("사용자 정보 파싱 오류:", error);
        navigate('/admin');
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length > 4) {
      alert('이미지는 최대 4개까지 업로드 가능합니다.');
      return;
    }

    setImages(files);

    // 미리보기 생성
    const previews = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(previews).then(setImagePreviews);
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);

    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkToken()) return;

    // 유효성 검사
    if (!title.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      alert('내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // FormData 생성
      const formData = new FormData();

      // 카테고리별 요청 데이터 구조 생성
      const requestData = {
        title: title.trim(),
        content: content.trim()
      };

      // JSON 데이터를 Blob으로 변환하여 추가
      const requestBlob = new Blob([JSON.stringify(requestData)], {
        type: 'application/json'
      });

      formData.append('request', requestBlob);

      // 이미지 파일들 추가
      if (images.length > 0) {
        images.forEach((image) => {
          formData.append('images', image);
        });
      }

      // 선택된 카테고리 정보 가져오기
      const categoryInfo = categories.find(cat => cat.id === selectedCategory);

      console.log('게시글 등록 요청:', {
        category: selectedCategory,
        title,
        content,
        imageCount: images.length
      });

      // API 호출
      const response = await API.post(categoryInfo.apiPath, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        alert('게시글이 성공적으로 등록되었습니다.');
        // 등록 완료 후 게시판 관리 페이지로 이동하면서 해당 카테고리를 선택한 상태로 이동
        // 카테고리 첫 글자를 대문자로 변환
        const categoryParam = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
        navigate(`/admin/boards?category=${categoryParam}`);
      } else {
        setError('게시글 등록에 실패했습니다: ' + (response.data?.message || '알 수 없는 오류'));
      }

    } catch (err) {
      console.error('게시글 등록 오류:', err);

      if (err.response?.data?.message) {
        setError('등록 실패: ' + err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('인증에 실패했습니다. 다시 로그인해주세요.');
      } else {
        setError('게시글 등록 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="post-create">
        <h2 className="title">게시글관리(게시글등록)</h2>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="create-form">
          {/* 입력 섹션 */}
          <div className="input-section">
            <h3>입력</h3>

            <div className="form-table">
              {/* 구분 */}
              <div className="form-row">
                <label className="form-label">구분</label>
                <div className="form-input-container">
                  <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="form-select"
                      disabled={loading}
                  >
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 제목 */}
              <div className="form-row">
                <label className="form-label">제목</label>
                <div className="form-input-container">
                  <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      placeholder="제목을 입력하세요"
                      disabled={loading}
                      maxLength={100}
                  />
                </div>
              </div>

              {/* 내용 */}
              <div className="form-row">
                <label className="form-label">내용</label>
                <div className="form-input-container">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-textarea"
                    placeholder="내용을 입력하세요"
                    disabled={loading}
                    rows={6}
                />
                </div>
              </div>

              {/* 이미지 */}
              <div className="form-row">
                <label className="form-label">이미지</label>
                <div className="form-input-container">
                  <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="form-file-input"
                      disabled={loading}
                  />
                  <div className="file-info">
                    최대 4개까지 업로드 가능합니다. (JPG, PNG, GIF)
                  </div>

                  {/* 이미지 미리보기 */}
                  {imagePreviews.length > 0 && (
                      <div className="image-preview-container">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="image-preview-item">
                              <img src={preview} alt={`미리보기 ${index + 1}`} />
                              <button
                                  type="button"
                                  onClick={() => handleRemoveImage(index)}
                                  className="remove-image-button"
                                  disabled={loading}
                              >
                                ×
                              </button>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 등록하기 버튼 */}
          <div className="form-actions">
            <button
                type="submit"
                className="submit-button"
                disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? '등록 중...' : '등록하기'}
            </button>
            <button
                type="button"
                onClick={() => {
                  const categoryParam = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
                  navigate(`/admin/boards?category=${categoryParam}`);
                }}
                className="cancel-button"
                disabled={loading}
            >
              취소
            </button>
          </div>
        </form>
      </div>
  );
};

export default PostCreate;