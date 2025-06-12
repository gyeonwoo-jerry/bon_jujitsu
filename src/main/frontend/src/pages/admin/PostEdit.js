// pages/admin/PostEdit.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import "../../styles/admin/admin.css";

const PostEdit = () => {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef(null);
  const originalImageIds = useRef([]);

  // 카테고리 정보 - Board, Notice, QnA 추가
  const [categories] = useState([
    { id: 'board', name: 'Board', apiPath: '/board' },
    { id: 'notice', name: 'Notice', apiPath: '/notice' },
    { id: 'skill', name: 'Skill', apiPath: '/skill' },
    { id: 'sponsor', name: 'Sponsor', apiPath: '/sponsor' },
    { id: 'news', name: 'News', apiPath: '/news' },
    { id: 'qna', name: 'QnA', apiPath: '/qna' }
  ]);

  // 폼 상태
  const [selectedCategory, setSelectedCategory] = useState(category || 'skill');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 이미지 관리
  const [existingImages, setExistingImages] = useState([]);
  const [keepImageIds, setKeepImageIds] = useState([]);
  const [newImages, setNewImages] = useState([]);

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

  // 카테고리별 이미지 필요 여부 확인 함수
  const isImageRequired = () => {
    // 모든 카테고리에서 이미지는 선택사항
    return false;
  };

  // 권한 체크
  useEffect(() => {
    if (!checkToken()) {
      navigate('/login');
      return;
    }

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

          setTitle(postData.title || '');
          setContent(postData.content || '');

          // 기존 이미지 설정
          if (postData.images && postData.images.length > 0) {
            console.log('서버에서 받은 이미지 데이터:', postData.images);

            const imageObjects = postData.images.map((img, index) => {
              console.log(`이미지 ${index}:`, img);

              if (typeof img === 'object' && img.url) {
                console.log(`이미지 ${index} - ID: ${img.id}, URL: ${img.url}`);

                const imageId = img.id || (1000 + index);

                return {
                  id: imageId,
                  url: img.url,
                  originalFileName: null
                };
              }
              else if (typeof img === 'string') {
                console.log(`이미지 ${index} - 문자열 URL: ${img}`);
                return {
                  id: 1000 + index,
                  url: img,
                  originalFileName: null
                };
              }

              console.log(`이미지 ${index} - 인식되지 않는 형식`);
              return null;
            }).filter(img => img !== null);

            setExistingImages(imageObjects);

            const imageIds = imageObjects.map(img => img.id).filter(id => id !== null);
            setKeepImageIds(imageIds);
            originalImageIds.current = [...imageIds];

            console.log('이미지 객체 정보:', imageObjects);
            console.log('유지할 이미지 ID 목록:', imageIds);
            console.log('원본 이미지 ID 목록 저장됨:', originalImageIds.current);
          } else {
            console.log('이미지가 없거나 유효하지 않음');
            setExistingImages([]);
            setKeepImageIds([]);
            originalImageIds.current = [];
          }

          setNewImages([]);
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

    const existingCount = keepImageIds ? keepImageIds.length : 0;
    const newCount = newImages ? newImages.length : 0;
    const totalImages = existingCount + newCount + files.length;

    if (totalImages > 4) {
      alert(`이미지는 최대 4개까지 업로드할 수 있습니다. (현재 유지 이미지: ${existingCount}개, 신규 이미지: ${newCount}개)`);
      return;
    }

    setNewImages(prev => [...(prev || []), ...files]);
    console.log('새 이미지 추가 후 keepImageIds:', keepImageIds);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 기존 이미지 제거 핸들러
  const handleRemoveExistingImage = (imageId) => {
    if (imageId === undefined || imageId === null) return;

    console.log(`이미지 ID '${imageId}' (타입: ${typeof imageId}) 제거 시도`);

    setKeepImageIds(prev => {
      const newIds = prev.filter(id => id !== imageId);
      console.log(`이미지 ID '${imageId}' 제거됨, 남은 ID:`, newIds);
      return newIds;
    });
  };

  // 새 이미지 제거 핸들러
  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!checkToken()) return;

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    if (!content.trim()) {
      setError('내용을 입력해주세요.');
      return;
    }

    // 이미지는 모든 카테고리에서 선택사항이므로 검증 제거
    // if (isImageRequired() && keepImageIds.length === 0 && newImages.length === 0) {
    //   setError('이미지를 최소 1개 이상 등록해주세요.');
    //   return;
    // }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();

      const postUpdate = {
        title: title.trim(),
        content: content.trim()
      };
      const updateBlob = new Blob([JSON.stringify(postUpdate)], { type: 'application/json' });
      formData.append('update', updateBlob);

      const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds || [])], { type: 'application/json' });
      formData.append('keepImageIds', keepImageIdsBlob);

      if (newImages && newImages.length > 0) {
        newImages.forEach(image => {
          formData.append('images', image);
        });
      }

      const categoryInfo = categories.find(cat => cat.id === selectedCategory);

      console.log('FormData 구성:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`${key}: Blob 데이터 (type: ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      console.log('게시글 수정 요청:', {
        category: selectedCategory,
        id: id,
        title,
        content,
        keepImageIds: keepImageIds.length,
        newImageCount: newImages.length,
        isImageRequired: isImageRequired()
      });

      const response = await API.patch(`${categoryInfo.apiPath}/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data?.success) {
        alert('게시글이 성공적으로 수정되었습니다.');
        navigate('/admin/posts');
      } else {
        setError('게시글 수정에 실패했습니다: ' + (response.data?.message || '알 수 없는 오류'));
      }

    } catch (err) {
      console.error('게시글 수정 오류:', err);

      if (err.response) {
        console.error('오류 상태:', err.response.status);
        console.error('오류 데이터:', err.response.data);
        console.error('오류 헤더:', err.response.headers);
        setError(`게시글 수정 실패 (${err.response.status}): ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('응답 없음:', err.request);
        setError('서버로부터 응답이 없습니다.');
      } else {
        console.error('오류 메시지:', err.message);
        setError('게시글 수정 중 오류가 발생했습니다: ' + err.message);
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

    alert(`
이미지 상태 정보:
- 기존 이미지 수: ${existingImages.length}개
- 유지할 이미지 ID 수: ${keepImageIds.length}개
- 유지할 이미지 ID 목록: ${keepImageIds.join(', ') || '없음'}
- 새 이미지 수: ${newImages.length}개
- 이미지 필수 여부: ${isImageRequired() ? '필수' : '선택사항'}
    `);
  };

  if (initialLoading) {
    return (
        <div className="post-create">
          <h2 className="title">게시글관리(게시글수정)</h2>
          <div className="loading-indicator">
            게시글 정보를 불러오는 중입니다...
          </div>
        </div>
    );
  }

  return (
    <div className="admin_main">
      
      <div className="admin_contents">
        <div className="page-header">
          <div className="title">게시글관리(게시글수정)</div>
        </div>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="form-container create-form">
          <table className="input-table">
            <tbody>
              <tr>
                <th>구분</th>
                <td>
                  <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="form-select"
                      disabled={true}
                  >
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                    ))}
                  </select>
                  <div className="file-info">
                    카테고리는 수정할 수 없습니다.
                  </div>
                </td>
              </tr>
              <tr>
                <th>제목</th>
                <td>
                <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="form-input"
                      placeholder="제목을 입력하세요"
                      disabled={loading}
                      maxLength={100}
                  />
                </td>
              </tr>
              <tr>
                <th>내용</th>
                <td>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="form-textarea"
                    placeholder="내용을 입력하세요"
                    disabled={loading}
                    rows={6}
                > </textarea>
                </td>
              </tr>
              <tr>
                <th>이미지</th>
                <td>
                <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      ref={fileInputRef}
                      className="hidden-file-input"
                      disabled={loading}
                  />

                  <div className="image-button-group">
                    <button
                        type="button"
                        className="image-upload-button"
                        onClick={handleImageUploadClick}
                        disabled={loading}
                    >
                      이미지 등록
                    </button>
                    <button
                        type="button"
                        className="image-debug-button"
                        onClick={debugImages}
                        disabled={loading}
                    >
                      이미지 정보 확인
                    </button>
                    <button
                        type="button"
                        className="image-restore-button"
                        onClick={() => {
                          setKeepImageIds([...originalImageIds.current]);
                          console.log('모든 기존 이미지 복원됨:', originalImageIds.current);
                          alert('모든 기존 이미지가 복원되었습니다.');
                        }}
                        disabled={loading}
                    >
                      모든 이미지 복원
                    </button>
                  </div>

                  <div className="file-info">
                    최대 4개까지 업로드 가능합니다. (JPG, PNG, GIF)
                    <span className="optional-notice"> - 이미지는 선택사항입니다.</span>
                  </div>
                  {/* 기존 이미지 표시 */}
                  <div className="image-section">
                      <h5>기존 이미지 ({existingImages.length}개)</h5>
                      <div className="image-preview-container">
                        {existingImages.length > 0 ? (
                            existingImages.map((image, index) => (
                                <div key={`existing-${index}`} className="image-preview">
                                  <img
                                      src={image.url}
                                      alt={`기존 이미지 ${index + 1}`}
                                      onError={(e) => {
                                        console.error('이미지 로드 실패:', image.url);
                                        e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAYAAACtWK6eAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABh0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzT7MfTgAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8yNC8xMqLz6JEAAADQSURBVHic7cExAQAAAMKg9U9tCF+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAOAAxvQAAeh3OxgAAAAASUVORK5CYII=';
                                      }}
                                  />
                                  <div className="image-tag">기존 [{image.id}]</div>
                                  {keepImageIds.includes(image.id) ? (
                                      <button
                                          type="button"
                                          className="remove-image"
                                          onClick={() => handleRemoveExistingImage(image.id)}
                                          disabled={loading}
                                      >
                                        ✕
                                      </button>
                                  ) : (
                                      <div className="removed-tag">삭제됨</div>
                                  )}
                                </div>
                            ))
                        ) : (
                            <div className="no-image-message">기존 이미지가 없습니다.</div>
                        )}
                      </div>
                    </div>

                    {/* 새 이미지 표시 */}
                    <div className="image-section">
                      <h5>새 이미지 ({newImages.length}개)</h5>
                      <div className="image-preview-container">
                        {newImages.length > 0 ? (
                            newImages.map((file, index) => (
                                <div key={`new-${index}`} className="image-preview">
                                  <img
                                      src={URL.createObjectURL(file)}
                                      alt={`새 이미지 ${index + 1}`}
                                  />
                                  <div className="image-tag new">신규</div>
                                  <button
                                      type="button"
                                      className="remove-image"
                                      onClick={() => handleRemoveNewImage(index)}
                                      disabled={loading}
                                  >
                                    ✕
                                  </button>
                                </div>
                            ))
                        ) : (
                            <div className="no-image-message">새 이미지가 없습니다.</div>
                        )}
                      </div>
                    </div>

                    {/* 이미지 개수 요약 표시 */}
                    <div className="image-summary">
                      <strong>이미지 현황:</strong> 기존 이미지 {keepImageIds.length}개 + 신규 이미지 {newImages.length}개 = 총 {keepImageIds.length + newImages.length}개
                      {(keepImageIds.length + newImages.length > 4) &&
                          <div className="image-warning">⚠️ 이미지는 최대 4개까지만 가능합니다!</div>
                      }
                    </div>
                </td>
              </tr>
            </tbody>
          </table>


          {/* 수정하기 버튼 */}
          <div className="form-buttons">
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
                  navigate('/admin/posts');
                }}
                className="cancel-button"
                disabled={loading}
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostEdit;