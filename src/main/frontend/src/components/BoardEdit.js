import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import { loggedNavigate } from '../utils/navigationLogger';
import '../styles/boardWrite.css';

const BoardEdit = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const safeNavigate = loggedNavigate(navigate);
  const fileInputRef = useRef(null);
  const originalImageIds = useRef([]); // 원래 이미지 ID 목록을 저장하는 ref

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');
  const [originalBoard, setOriginalBoard] = useState(null);

  // 게시글 정보 상태
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  // 이미지 관련 상태
  const [newImages, setNewImages] = useState([]); // 새로 추가할 이미지 파일
  const [newImagePreviews, setNewImagePreviews] = useState([]); // 새 이미지 미리보기
  const [existingImages, setExistingImages] = useState([]); // 기존 이미지 정보
  const [keepImageIds, setKeepImageIds] = useState([]); // 유지할 기존 이미지 ID들

  const maxImages = 10;
  const maxImageSize = 10 * 1024 * 1024; // 10MB

  // 기존 게시글 데이터 불러오기
  useEffect(() => {
    const fetchBoardData = async () => {
      if (!boardId) {
        setError('게시글 ID가 없습니다.');
        setInitialLoading(false);
        return;
      }

      try {
        setInitialLoading(true);
        setError('');

        console.log('📥 기존 게시글 데이터 불러오기:', boardId);
        const response = await API.get(`/board/${boardId}`);

        if (response.data.success) {
          const boardData = response.data.content;
          setOriginalBoard(boardData);

          // 폼 데이터 설정
          setFormData({
            title: boardData.title || '',
            content: boardData.content || ''
          });

          // 기존 이미지 설정
          if (boardData.images && Array.isArray(boardData.images)) {
            console.log('서버에서 받은 이미지 데이터:', boardData.images);

            const imageObjects = boardData.images.map((img, index) => ({
              id: img.id || index, // id가 없으면 인덱스 사용
              url: img.url
            }));

            setExistingImages(imageObjects);

            // 모든 기존 이미지 ID를 유지할 목록에 추가
            const imageIds = imageObjects.map(img => img.id);
            setKeepImageIds(imageIds);
            originalImageIds.current = [...imageIds];

            console.log('기존 이미지 설정 완료:', imageObjects);
            console.log('유지할 이미지 ID 목록:', imageIds);
          } else {
            setExistingImages([]);
            setKeepImageIds([]);
            originalImageIds.current = [];
          }

          console.log('✅ 게시글 데이터 로드 완료:', boardData);
        } else {
          throw new Error(response.data.message || '게시글을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('❌ 게시글 데이터 로드 실패:', error);
        if (error.response?.status === 404) {
          setError('존재하지 않는 게시글입니다.');
        } else if (error.response?.status === 403) {
          setError('게시글에 접근할 권한이 없습니다.');
        } else {
          setError('게시글을 불러오는데 실패했습니다.');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId]);

  // 수정 권한 확인
  useEffect(() => {
    if (originalBoard) {
      checkEditPermission();
    }
  }, [originalBoard]);

  // 로그인 상태 확인
  const isLoggedIn = () => {
    const token = localStorage.getItem('token');
    const accessToken = localStorage.getItem('accessToken');
    return !!(token || accessToken);
  };

  // 현재 사용자가 작성자인지 확인
  const isAuthor = () => {
    if (!originalBoard) return false;

    const userInfoString = localStorage.getItem('userInfo');
    const userInfo = JSON.parse(userInfoString || '{}');

    // JWT 토큰에서 사용자 ID 추출 (userInfo.id가 없을 경우)
    let userId = userInfo.id;
    if (!userId) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const payload = token.split('.')[1];
          const decodedPayload = JSON.parse(atob(payload));
          userId = decodedPayload.sub;
        } catch (error) {
          console.error('토큰 디코딩 실패:', error);
        }
      }
    }

    console.log('👤 작성자 확인:', userId, 'vs', originalBoard.authorId);
    return String(userId) === String(originalBoard.authorId);
  };

  // 관리자인지 확인
  const isAdmin = () => {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    return userInfo.role === 'ADMIN' || userInfo.isAdmin === true;
  };

  // 수정 권한 확인
  const checkEditPermission = () => {
    if (!isLoggedIn()) {
      alert('로그인이 필요합니다.');
      safeNavigate('/login');
      return;
    }

    const userIsAuthor = isAuthor();
    const userIsAdmin = isAdmin();

    if (!userIsAuthor && !userIsAdmin) {
      alert('게시글 수정 권한이 없습니다.');
      safeNavigate(-1); // 이전 페이지로 돌아가기
      return;
    }
  };

  // 입력값 변경 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 새 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // 최대 이미지 개수 확인
    const totalImages = keepImageIds.length + newImages.length + files.length;
    if (totalImages > maxImages) {
      alert(`이미지는 최대 ${maxImages}개까지 업로드할 수 있습니다. (현재 유지 이미지: ${keepImageIds.length}개, 신규 이미지: ${newImages.length}개)`);
      return;
    }

    // 파일 크기 검증
    const oversizedFiles = files.filter(file => file.size > maxImageSize);
    if (oversizedFiles.length > 0) {
      alert('이미지 크기는 10MB 이하여야 합니다.');
      return;
    }

    // 이미지 파일 타입 검증
    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    // 새 이미지 파일 추가
    setNewImages(prev => [...prev, ...files]);

    // 미리보기 생성
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImagePreviews(prev => [...prev, {
          file: file,
          url: e.target.result,
          name: file.name
        }]);
      };
      reader.readAsDataURL(file);
    });

    console.log('새 이미지 추가 후 keepImageIds:', keepImageIds);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
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
    setNewImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // 폼 유효성 검증
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('제목을 입력해주세요.');
      return false;
    }

    if (!formData.content.trim()) {
      setError('내용을 입력해주세요.');
      return false;
    }

    if (formData.title.length > 100) {
      setError('제목은 100자 이하로 입력해주세요.');
      return false;
    }

    if (formData.content.length > 5000) {
      setError('내용은 5000자 이하로 입력해주세요.');
      return false;
    }

    return true;
  };

  // 게시글 수정 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();

      // 수정 데이터
      const updateData = {
        title: formData.title,
        content: formData.content
      };

      const requestBlob = new Blob([JSON.stringify(updateData)], {
        type: 'application/json'
      });
      formDataToSend.append('update', requestBlob);

      // 새 이미지 파일들 추가
      if (newImages.length > 0) {
        newImages.forEach(image => {
          formDataToSend.append('images', image);
        });
      }

      // 유지할 기존 이미지 ID들 추가
      if (keepImageIds.length > 0) {
        const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds)], {
          type: 'application/json'
        });
        formDataToSend.append('keepImageIds', keepImageIdsBlob);
      }

      console.log('게시글 수정 요청:', {
        boardId,
        title: formData.title,
        content: formData.content,
        newImageCount: newImages.length,
        keepImageIds: keepImageIds
      });

      const response = await API.patch(`/board/${boardId}`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        alert('게시글이 성공적으로 수정되었습니다.');
        safeNavigate(-1); // 이전 페이지(상세 페이지)로 돌아가기
      } else {
        throw new Error(response.data.message || '게시글 수정에 실패했습니다.');
      }
    } catch (error) {
      console.error('게시글 수정 오류:', error);

      if (error.response) {
        if (error.response.status === 401) {
          setError('로그인이 필요합니다.');
        } else if (error.response.status === 403) {
          setError('수정 권한이 없습니다.');
        } else {
          setError(error.response.data?.message || '게시글 수정에 실패했습니다.');
        }
      } else {
        setError('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    const hasChanges =
        formData.title !== originalBoard?.title ||
        formData.content !== originalBoard?.content ||
        newImages.length > 0 ||
        keepImageIds.length !== existingImages.length;

    if (hasChanges) {
      if (window.confirm('수정 중인 내용이 있습니다. 정말 취소하시겠습니까?')) {
        safeNavigate(-1); // 이전 페이지로 돌아가기
      }
    } else {
      safeNavigate(-1);
    }
  };

  if (initialLoading) {
    return (
        <div className="write-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>게시글 정보를 불러오는 중...</p>
          </div>
        </div>
    );
  }

  if (!originalBoard) {
    return (
        <div className="write-container">
          <div className="error-message">
            <h3>게시글을 찾을 수 없습니다</h3>
            <p>{error}</p>
            <button onClick={() => safeNavigate(-1)} className="btn-secondary">
              돌아가기
            </button>
          </div>
        </div>
    );
  }

  return (
      <div className="write-container">
        <div className="write-header">
          <h1>게시글 수정</h1>
          <div className="write-actions">
            <button
                type="button"
                onClick={handleCancel}
                className="cancel-button"
                disabled={loading}
            >
              취소
            </button>
            <button
                type="submit"
                onClick={handleSubmit}
                className="submit-button"
                disabled={loading}
            >
              {loading ? '수정 중...' : '수정 완료'}
            </button>
          </div>
        </div>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="write-form">
          <div className="form-group">
            <label htmlFor="title">제목 *</label>
            <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="제목을 입력해주세요 (최대 100자)"
                maxLength={100}
                required
                disabled={loading}
            />
            <div className="char-count">
              {formData.title.length}/100
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">내용 *</label>
            <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="내용을 입력해주세요 (최대 5000자)"
                maxLength={5000}
                rows={15}
                required
                disabled={loading}
            />
            <div className="char-count">
              {formData.content.length}/5000
            </div>
          </div>

          <div className="form-group">
            <label>이미지 첨부</label>

            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                ref={fileInputRef}
                style={{ display: 'none' }}
                disabled={loading}
            />

            <div className="image-info-section">
              <button
                  type="button"
                  className="image-upload-button"
                  onClick={handleImageUploadClick}
                  disabled={loading || (keepImageIds.length + newImages.length) >= maxImages}
              >
                새 이미지 추가
              </button>
              <div className="upload-info">
                * 이미지는 최대 {maxImages}개, 각 파일당 10MB 이하만 업로드 가능합니다.
              </div>
            </div>

            <div className="image-management-section">
              <h4>이미지 관리</h4>

              {/* 기존 이미지 표시 */}
              {existingImages.length > 0 && (
                  <div>
                    <h5>기존 이미지 ({existingImages.length}개)</h5>
                    <div className="image-preview-container">
                      {existingImages.map((image, index) => (
                          <div
                              key={`existing-${index}`}
                              className={`image-preview ${!keepImageIds.includes(image.id) ? 'removed' : ''}`}
                          >
                            <img
                                src={image.url}
                                alt={`기존 이미지 ${index + 1}`}
                                onError={(e) => {
                                  console.error('이미지 로드 실패:', image.url);
                                  e.target.src = '/images/blank_img.png';
                                }}
                            />
                            <div className="image-tag">기존 [{image.id}]</div>
                            {keepImageIds.includes(image.id) ? (
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={() => handleRemoveExistingImage(image.id)}
                                    disabled={loading}
                                    title="이미지 삭제"
                                >
                                  ✕
                                </button>
                            ) : (
                                <div className="removed-tag">삭제됨</div>
                            )}
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              {/* 새 이미지 표시 */}
              {newImagePreviews.length > 0 && (
                  <div>
                    <h5>새로 추가할 이미지 ({newImagePreviews.length}개)</h5>
                    <div className="image-preview-container">
                      {newImagePreviews.map((preview, index) => (
                          <div key={`new-${index}`} className="image-preview">
                            <img
                                src={preview.url}
                                alt={`새 이미지 ${index + 1}`}
                            />
                            <div className="image-tag">신규</div>
                            <button
                                type="button"
                                className="remove-image"
                                onClick={() => handleRemoveNewImage(index)}
                                disabled={loading}
                                title="이미지 삭제"
                            >
                              ✕
                            </button>
                            <div className="image-name">{preview.name}</div>
                          </div>
                      ))}
                    </div>
                  </div>
              )}

              {/* 이미지 개수 요약 표시 */}
              <div className="image-summary">
                <strong>이미지 현황:</strong> 기존 이미지 {keepImageIds.length}개 + 신규 이미지 {newImages.length}개 = 총 {keepImageIds.length + newImages.length}개
                {(keepImageIds.length + newImages.length > maxImages) &&
                    <div style={{ color: 'red', marginTop: '5px' }}>⚠️ 이미지는 최대 {maxImages}개까지만 가능합니다!</div>
                }
              </div>
            </div>
          </div>
        </form>

        {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner"></div>
              <p>게시글을 수정하고 있습니다...</p>
            </div>
        )}
      </div>
  );
};

export default BoardEdit;