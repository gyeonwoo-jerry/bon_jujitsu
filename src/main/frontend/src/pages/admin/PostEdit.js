// pages/admin/PostEdit.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import '../../styles/admin/postForm.css';

const PostEdit = () => {
  const { category, id } = useParams(); // URL에서 카테고리와 ID 파라미터 가져오기
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);

  // 카테고리 정보
  const [categories] = useState([
    { id: 'skill', name: 'Skill', apiPath: '/skill' },
    { id: 'sponsor', name: 'Sponsor', apiPath: '/sponsor' },
    { id: 'news', name: 'News', apiPath: '/news' }
  ]);

  // 폼 상태
  const [selectedCategory, setSelectedCategory] = useState(category || 'skill');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [newImages, setNewImages] = useState([]); // 새로 추가할 이미지들

  // 기존 이미지 관리
  const [existingImages, setExistingImages] = useState([]);
  const [keepImageIds, setKeepImageIds] = useState([]);

  // UI 상태
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
          alert("관리자만 게시글을 수정할 수 있습니다.");
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

  // 게시글 정보 불러오기
  useEffect(() => {
    const fetchPostData = async () => {
      if (!checkToken()) {
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      setError(null);

      try {
        // 카테고리 정보 가져오기
        const categoryInfo = categories.find(cat => cat.id === selectedCategory);
        if (!categoryInfo) {
          setError('잘못된 카테고리입니다.');
          return;
        }

        console.log('게시글 정보 조회:', `${categoryInfo.apiPath}/${id}`);
        const res = await API.get(`${categoryInfo.apiPath}/${id}`);

        if (res.data?.success) {
          const postData = res.data.content;
          console.log('게시글 정보:', postData);

          // 게시글 데이터 설정
          setTitle(postData.title || '');
          setContent(postData.content || '');

          // 기존 이미지 설정
          if (postData.images && postData.images.length > 0) {
            console.log('서버에서 받은 이미지 데이터:', postData.images);

            const imageObjects = postData.images.map(img => ({
              id: img.id,
              url: img.url || img.imagePath || img.path
            }));

            setExistingImages(imageObjects);
            const imageIds = imageObjects.map(img => img.id);
            setKeepImageIds(imageIds);

            console.log('이미지 객체 정보:', imageObjects);
            console.log('유지할 이미지 ID 목록:', imageIds);
          } else {
            console.log('이미지가 없음');
            setExistingImages([]);
            setKeepImageIds([]);
          }
        } else {
          setError('게시글 정보를 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
        }
      } catch (err) {
        console.error('게시글 정보 불러오기 오류:', err);
        if (err.response?.status === 404) {
          setError('해당 게시글을 찾을 수 없습니다.');
        } else if (err.response?.status === 401) {
          setError('인증에 실패했습니다. 다시 로그인해주세요.');
        } else {
          setError('게시글 정보를 불러오는 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
        }
      } finally {
        setInitialLoading(false);
      }
    };

    if (id && selectedCategory) {
      fetchPostData();
    }
  }, [id, selectedCategory]);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // 최대 4개 이미지 제한 (기존 유지 이미지 + 새 이미지)
    const existingCount = keepImageIds ? keepImageIds.length : 0;
    const newCount = newImages ? newImages.length : 0;
    const totalImages = existingCount + newCount + files.length;

    if (totalImages > 4) {
      alert('이미지는 최대 4개까지 업로드할 수 있습니다.');
      return;
    }

    // 새 이미지 파일 추가
    setNewImages(prev => [...prev, ...files]);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 기존 이미지 제거 핸들러
  const handleRemoveExistingImage = (imageId) => {
    if (imageId === undefined || imageId === null) return;

    console.log(`이미지 ID '${imageId}' 제거 시도`);
    setKeepImageIds(prev => prev.filter(id => id !== imageId));
    console.log(`이미지 ID '${imageId}' 제거됨`);
  };

  // 새 이미지 제거 핸들러
  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
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

    // 이미지 검증
    if (keepImageIds.length === 0 && newImages.length === 0) {
      alert('이미지를 최소 1개 이상 등록해주세요.');
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
      formData.append('update', requestBlob);

      // keepImageIds 추가 (항상 추가, 빈 배열이라도)
      const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds || [])], {
        type: 'application/json'
      });
      formData.append('keepImageIds', keepImageIdsBlob);

      // 새 이미지 파일들 추가 (있는 경우에만)
      if (newImages.length > 0) {
        newImages.forEach((image) => {
          formData.append('images', image);
        });
      }

      // 선택된 카테고리 정보 가져오기
      const categoryInfo = categories.find(cat => cat.id === selectedCategory);

      console.log('게시글 수정 요청:', {
        category: selectedCategory,
        id: id,
        title,
        content,
        keepImageIds: keepImageIds.length,
        newImageCount: newImages.length
      });

      // 디버깅용
      console.log('FormData 구성:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`${key}: Blob 데이터 (type: ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // API 호출
      const response = await API.patch(`${categoryInfo.apiPath}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        alert('게시글이 성공적으로 수정되었습니다.');
        // 수정 완료 후 게시판 관리 페이지로 이동하면서 해당 카테고리를 선택한 상태로 이동
        const categoryParam = selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1);
        navigate(`/admin/boards?category=${categoryParam}`);
      } else {
        setError('게시글 수정에 실패했습니다: ' + (response.data?.message || '알 수 없는 오류'));
      }

    } catch (err) {
      console.error('게시글 수정 오류:', err);

      if (err.response?.data?.message) {
        setError('수정 실패: ' + err.response.data.message);
      } else if (err.response?.status === 401) {
        setError('인증에 실패했습니다. 다시 로그인해주세요.');
      } else if (err.response?.status === 404) {
        setError('해당 게시글을 찾을 수 없습니다.');
      } else {
        setError('게시글 수정 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      }
    } finally {
      setLoading(false);
    }
  };

  // 디버깅용 이미지 정보 출력 함수
  const debugImages = () => {
    console.log('현재 existingImages:', existingImages);
    console.log('현재 keepImageIds:', keepImageIds);
    console.log('현재 newImages:', newImages);
    alert(`기존 이미지: ${existingImages.length}개, 유지할 이미지: ${keepImageIds.length}개, 새 이미지: ${newImages.length}개`);
  };

  if (initialLoading) {
    return (
        <div className="post-create">
          <h2 className="title">게시글관리(게시글수정)</h2>
          <div style={{ textAlign: 'center', padding: '20px', fontSize: '14px', color: '#666' }}>
            게시글 정보를 불러오는 중입니다...
          </div>
        </div>
    );
  }

  return (
      <div className="post-create">
        <h2 className="title">게시글관리(게시글수정)</h2>

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
                      disabled={true} // 수정 시에는 카테고리 변경 불가
                  >
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                    ))}
                  </select>
                  <div className="file-info" style={{ marginTop: '5px' }}>
                    카테고리는 수정할 수 없습니다.
                  </div>
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
                      ref={fileInputRef}
                      className="form-file-input"
                      style={{ display: 'none' }}
                      disabled={loading}
                  />

                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button
                        type="button"
                        className="submit-button"
                        onClick={handleImageUploadClick}
                        disabled={loading}
                        style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      이미지 등록
                    </button>
                    <button
                        type="button"
                        className="cancel-button"
                        onClick={debugImages}
                        disabled={loading}
                        style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      이미지 정보 확인
                    </button>
                  </div>

                  <div className="file-info">
                    최대 4개까지 업로드 가능합니다. (JPG, PNG, GIF)
                  </div>

                  {/* 이미지 관리 섹션 */}
                  <div className="image-management-section" style={{ marginTop: '20px' }}>
                    {/* 기존 이미지 표시 */}
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                        기존 이미지 ({existingImages.length}개)
                      </h4>
                      <div className="image-preview-container">
                        {existingImages.length > 0 ? (
                            existingImages.map((image, index) => (
                                <div key={`existing-${index}`} className="image-preview-item">
                                  <img
                                      src={image.url}
                                      alt={`기존 이미지 ${index + 1}`}
                                      onError={(e) => {
                                        console.error('이미지 로드 실패:', image.url);
                                        e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABh0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzT7MfTgAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8yNC8xMqLz6JEAAADQSURBVHic7cExAQAAAMKg9U9tCF+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAxvQAAeh3OxgAAAAASUVORK5CYII=';
                                      }}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    backgroundColor: 'rgba(0,0,0,0.7)',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    기존 [{image.id}]
                                  </div>
                                  {keepImageIds.includes(image.id) ? (
                                      <button
                                          type="button"
                                          className="remove-image-button"
                                          onClick={() => handleRemoveExistingImage(image.id)}
                                          disabled={loading}
                                      >
                                        ×
                                      </button>
                                  ) : (
                                      <div style={{
                                        position: 'absolute',
                                        top: '2px',
                                        right: '2px',
                                        backgroundColor: 'rgba(255,0,0,0.8)',
                                        color: 'white',
                                        fontSize: '10px',
                                        padding: '2px 4px',
                                        borderRadius: '3px'
                                      }}>
                                        삭제됨
                                      </div>
                                  )}
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#666', fontSize: '14px' }}>기존 이미지가 없습니다.</div>
                        )}
                      </div>
                    </div>

                    {/* 새 이미지 표시 */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                        새 이미지 ({newImages.length}개)
                      </h4>
                      <div className="image-preview-container">
                        {newImages.length > 0 ? (
                            newImages.map((file, index) => (
                                <div key={`new-${index}`} className="image-preview-item">
                                  <img
                                      src={URL.createObjectURL(file)}
                                      alt={`새 이미지 ${index + 1}`}
                                  />
                                  <div style={{
                                    position: 'absolute',
                                    top: '2px',
                                    left: '2px',
                                    backgroundColor: 'rgba(0,128,0,0.7)',
                                    color: 'white',
                                    fontSize: '10px',
                                    padding: '2px 4px',
                                    borderRadius: '3px'
                                  }}>
                                    신규
                                  </div>
                                  <button
                                      type="button"
                                      className="remove-image-button"
                                      onClick={() => handleRemoveNewImage(index)}
                                      disabled={loading}
                                  >
                                    ×
                                  </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ color: '#666', fontSize: '14px' }}>새 이미지가 없습니다.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 수정하기 버튼 */}
          <div className="form-actions">
            <button
                type="submit"
                className="submit-button"
                disabled={loading || !title.trim() || !content.trim()}
            >
              {loading ? '수정 중...' : '수정하기'}
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

export default PostEdit;