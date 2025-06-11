import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import "../../styles/admin/admin.css";

const ProductEdit = () => {
  const { itemId } = useParams(); // URL에서 itemId 파라미터 가져오기
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // 상품 정보 상태
  const [productData, setProductData] = useState({
    name: '',
    content: '',
    price: '',
    sale: '',
    options: [{ id: null, size: '', color: '', amount: '1' }],
    images: [] // 새로 추가할 이미지 파일 객체들이 저장됩니다
  });

  // 기존 이미지 정보 (URL과 ID 모두 저장)
  const [existingImages, setExistingImages] = useState([]);

  // 유지할 이미지 ID 배열 (서버에서 ID로 이미지를 관리하는 경우)
  const [keepImageIds, setKeepImageIds] = useState([]);

  // 자주 사용하는 색상 프리셋
  const colorPresets = [
    'BLACK', 'WHITE', 'RED', 'BLUE', 'GREEN', 'YELLOW', 'NAVY', 'GRAY', 'BEIGE', 'BROWN', 'PINK', 'PURPLE', 'ORANGE'
  ];

  // 토큰 확인 함수
  const checkToken = () => {
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다. 토큰이 없거나 만료되었습니다.");
      return false;
    }
    return true;
  };

  // 상품 정보 불러오기
  useEffect(() => {
    const fetchProductData = async () => {
      // 토큰 확인
      if (!checkToken()) {
        setInitialLoading(false);
        return;
      }

      setInitialLoading(true);
      setError(null);

      try {
        const res = await API.get(`/items/${itemId}`);

        if (res.data?.success) {
          const itemData = res.data.content;
          console.log('상품 정보:', itemData);

          // 상품 데이터 설정
          setProductData({
            name: itemData.name || '',
            content: itemData.content || '',
            price: String(itemData.price || ''),
            sale: String(itemData.sale || ''),
            options: itemData.options?.length > 0
                ? itemData.options.map(opt => ({
                  id: opt.id, // 옵션 ID 저장
                  size: opt.size || '',
                  color: opt.color || '',
                  amount: String(opt.amount || '1')
                }))
                : [{ id: null, size: '', color: '', amount: '1' }],
            images: [] // 새로 추가할 이미지 배열 초기화
          });

          // 기존 이미지 설정 - 수정된 ItemResponse 형식에 맞게 처리
          if (itemData.images && itemData.images.length > 0) {
            console.log('서버에서 받은 이미지 데이터:', itemData.images);

            // 이미지 객체 처리 (id와 imagePath 필드를 가진 객체 배열)
            const imageObjects = itemData.images.map(img => ({
              id: img.id,
              url: img.imagePath
            }));

            setExistingImages(imageObjects);

            // 모든 이미지 ID를 유지할 목록에 추가 (기본적으로 모든 기존 이미지 유지)
            const imageIds = imageObjects.map(img => img.id);
            setKeepImageIds(imageIds);

            console.log('이미지 객체 정보:', imageObjects);
            console.log('유지할 실제 이미지 ID 목록:', imageIds);
          } else {
            console.log('이미지가 없거나 유효하지 않음');
            setExistingImages([]);
            setKeepImageIds([]);
          }
        } else {
          setError('상품 정보를 불러오는데 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
        }
      } catch (err) {
        console.error('상품 정보 불러오기 오류:', err);
        setError('상품 정보를 불러오는 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
      } finally {
        setInitialLoading(false);
      }
    };

    fetchProductData();
  }, [itemId]);

  // 상품 정보 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // 숫자 필드인 경우 숫자만 허용
    if (['price', 'sale'].includes(name)) {
      if (value === '' || /^\d+$/.test(value)) {
        setProductData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setProductData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // 프리셋 색상 적용 핸들러
  const applyPresetColor = (index, presetColor) => {
    const newOptions = [...productData.options];
    newOptions[index].color = presetColor;

    setProductData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // 옵션 입력 핸들러
  const handleOptionChange = (index, field, value) => {
    const newOptions = [...productData.options];

    // 수량 필드인 경우 숫자만 허용
    if (field === 'amount') {
      if (value === '' || /^\d+$/.test(value)) {
        newOptions[index][field] = value;
      }
    } else {
      newOptions[index][field] = value;
    }

    setProductData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // 옵션 추가 핸들러
  const handleAddOption = () => {
    setProductData(prev => ({
      ...prev,
      options: [...prev.options, { id: null, size: '', color: '', amount: '1' }]
    }));
  };

  // 옵션 삭제 핸들러
  const handleRemoveOption = (index) => {
    if (productData.options.length <= 1) {
      alert('최소 1개 이상의 옵션이 필요합니다.');
      return;
    }

    const newOptions = [...productData.options];
    newOptions.splice(index, 1);

    setProductData(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    // 최대 5개 이미지 파일 제한 (기존 유지 이미지 + 새 이미지)
    const existingCount = keepImageIds ? keepImageIds.length : 0;
    const newCount = productData.images ? productData.images.length : 0;
    const totalImages = existingCount + newCount + files.length;

    if (totalImages > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    // 새 이미지 파일 추가 (기존 이미지 유지)
    setProductData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...files]
    }));
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 기존 이미지 제거 핸들러
  const handleRemoveExistingImage = (imageId) => {
    if (imageId === undefined || imageId === null) return;

    // 디버깅용 로그
    console.log(`이미지 ID '${imageId}' (타입: ${typeof imageId}) 제거 시도`);

    // keepImageIds에서 해당 ID 제거
    setKeepImageIds(prev => prev.filter(id => id !== imageId));
    console.log(`이미지 ID '${imageId}' 제거됨, 남은 ID:`, keepImageIds.filter(id => id !== imageId));
  };

  // 새 이미지 제거 핸들러
  const handleRemoveNewImage = (index) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 기본 검증...
    if (!productData.name || !productData.price) {
      setError('상품명과 가격은 필수 입력 항목입니다.');
      return;
    }

    // 옵션 검증...
    for (const option of productData.options) {
      if (!option.size || !option.color || !option.amount || parseInt(option.amount) <= 0) {
        setError('모든 옵션 정보를 올바르게 입력해주세요.');
        return;
      }
    }

    // 이미지 검증
    if (keepImageIds.length === 0 && productData.images.length === 0) {
      setError('상품 이미지를 최소 1개 이상 등록해주세요.');
      return;
    }

    // 토큰 확인
    if (!checkToken()) return;

    setLoading(true);
    setError(null);

    try {
      // 1. FormData 생성
      const formData = new FormData();

      // 2. update 필드 추가 (JSON)
      const itemUpdate = {
        name: productData.name,
        content: productData.content,
        price: parseInt(productData.price),
        sale: productData.sale ? parseInt(productData.sale) : null,
        option: productData.options.map(option => ({
          id: option.id || null,
          size: option.size || "NONE",
          color: option.color || "DEFAULT",
          amount: parseInt(option.amount) || 1
        }))
      };
      const updateBlob = new Blob([JSON.stringify(itemUpdate)], { type: 'application/json' });
      formData.append('update', updateBlob);

      // 3. keepImageIds 필드 추가 (JSON 배열)
      // 중요: 항상 keepImageIds 추가 (빈 배열이라도)
      const keepImageIdsBlob = new Blob([JSON.stringify(keepImageIds || [])], { type: 'application/json' });
      formData.append('keepImageIds', keepImageIdsBlob);

      // 4. 새 이미지가 있는 경우에만 추가
      if (productData.images && productData.images.length > 0) {
        productData.images.forEach(image => {
          formData.append('images', image);
        });
      }
      // 새 이미지가 없는 경우에는 아무것도 추가할 필요 없음 - 백엔드가 수정되었으므로

      // 디버깅용
      console.log('FormData 구성:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof Blob) {
          console.log(`${key}: Blob 데이터 (type: ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }

      // 5. API 요청
      const res = await API.patch(`/items/${itemId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        }
      });

      if (res.data?.success) {
        alert('상품이 성공적으로 수정되었습니다.');
        navigate('/admin/products');
      } else {
        setError('상품 수정에 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      // 에러 처리 코드는 그대로 유지
      console.error('상품 수정 오류:', err);

      if (err.response) {
        console.error('오류 상태:', err.response.status);
        console.error('오류 데이터:', err.response.data);
        console.error('오류 헤더:', err.response.headers);
        setError(`상품 수정 실패 (${err.response.status}): ${err.response.data?.message || err.message}`);
      } else if (err.request) {
        console.error('응답 없음:', err.request);
        setError('서버로부터 응답이 없습니다.');
      } else {
        console.error('오류 메시지:', err.message);
        setError('상품 수정 중 오류가 발생했습니다: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // 디버깅용 이미지 정보 출력 함수
  const debugImages = () => {
    console.log('현재 existingImages:', existingImages);
    console.log('현재 keepImageIds:', keepImageIds);
    alert(`기존 이미지 수: ${existingImages.length}, 유지할 이미지 ID 수: ${keepImageIds.length}, ID 목록: ${keepImageIds.join(', ')}`);
  };

  if (initialLoading) {
    return (
        <div className="product-form-container">
          <h2 className="title">상품관리(상품수정)</h2>
          <div className="loading-indicator">상품 정보를 불러오는 중입니다...</div>
        </div>
    );
  }

  return (
      <div className="product-form-container">
        <h2 className="title">상품관리(상품수정)</h2>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <table className="input-table">
            <tbody>
            <tr>
              <th>상품명</th>
              <td>
                <input
                    type="text"
                    name="name"
                    value={productData.name}
                    onChange={handleInputChange}
                    className="name-input"
                    required
                />
              </td>
            </tr>
            <tr>
              <th>상품 설명</th>
              <td>
                <textarea
                    name="content"
                    value={productData.content}
                    onChange={handleInputChange}
                    rows="5"
                    placeholder="상품 설명을 입력하세요"
                />
              </td>
            </tr>
            <tr>
              <th>가격</th>
              <td>
                <input
                    type="text"
                    name="price"
                    value={productData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="숫자만 입력"
                />
              </td>
            </tr>
            <tr>
              <th>할인</th>
              <td>
                <input
                    type="text"
                    name="sale"
                    value={productData.sale}
                    onChange={handleInputChange}
                    placeholder="할인가격 (없으면 비워두세요)"
                />
              </td>
            </tr>
            <tr>
              <th>옵션 관리</th>
              <td>
                <div className="options-header">
                  <div className="option-header-item">사이즈</div>
                  <div className="option-header-item">색상</div>
                  <div className="option-header-item">수량</div>
                  <div className="option-header-item option-actions">작업</div>
                </div>

                {productData.options.map((option, index) => (
                    <div key={index} className="option-row">
                      <div className="option-item">
                        <input
                            type="text"
                            value={option.size}
                            onChange={(e) => handleOptionChange(index, 'size', e.target.value)}
                            placeholder="사이즈 입력"
                        />
                      </div>
                      <div className="option-item">
                        <input
                            type="text"
                            value={option.color}
                            onChange={(e) => handleOptionChange(index, 'color', e.target.value)}
                            placeholder="색상 입력"
                        />
                      </div>
                      <div className="option-item">
                        <input
                            type="text"
                            value={option.amount}
                            onChange={(e) => handleOptionChange(index, 'amount', e.target.value)}
                            placeholder="수량"
                        />
                      </div>
                      <div className="option-item option-actions">
                        {index === 0 ? (
                            <button
                                type="button"
                                className="add-option"
                                onClick={handleAddOption}
                                title="옵션 추가"
                            >
                              +
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="remove-option"
                                onClick={() => handleRemoveOption(index)}
                                title="옵션 삭제"
                            >
                              -
                            </button>
                        )}
                      </div>
                    </div>
                ))}

                <div className="color-presets">
                  <div className="preset-label">자주 사용하는 색상:</div>
                  <div className="preset-buttons">
                    {colorPresets.map(color => (
                        <button
                            key={color}
                            type="button"
                            className="preset-button color-preset-button"
                            style={{ backgroundColor: color.toLowerCase() }}
                            onClick={() => {
                              // 현재 선택된 옵션에 색상 적용 (마지막으로 추가된 옵션)
                              if (productData.options.length > 0) {
                                // 마지막 옵션에 색상 적용
                                const lastIndex = productData.options.length - 1;
                                applyPresetColor(lastIndex, color);
                              }
                            }}
                            title={color}
                        >
                          {color}
                        </button>
                    ))}
                  </div>
                </div>
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
                />
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <button
                      type="button"
                      className="image-upload-button"
                      onClick={handleImageUploadClick}
                  >
                    이미지 등록
                  </button>
                  <button
                      type="button"
                      className="image-upload-button"
                      onClick={debugImages}
                      style={{ backgroundColor: '#e74c3c' }}
                  >
                    이미지 정보 확인
                  </button>
                </div>

                <div className="image-management-section">
                  <h4>이미지 관리</h4>

                  {/* 기존 이미지 표시 */}
                  <div>
                    <h5>기존 이미지 ({existingImages.length}개)</h5>
                    <div className="image-preview-container">
                      {existingImages.length > 0 ? (
                          existingImages.map((image, index) => (
                              <div key={`existing-${index}`} className="image-preview">
                                <img
                                    src={image.url}
                                    alt={`상품 이미지 ${index + 1}`}
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
                                    >
                                      ✕
                                    </button>
                                ) : (
                                    <div className="removed-tag">삭제됨</div>
                                )}
                              </div>
                          ))
                      ) : (
                          <div>기존 이미지가 없습니다.</div>
                      )}
                    </div>
                  </div>

                  {/* 새 이미지 표시 */}
                  <div>
                    <h5>새 이미지 ({productData.images.length}개)</h5>
                    <div className="image-preview-container">
                      {productData.images.length > 0 ? (
                          productData.images.map((file, index) => (
                              <div key={`new-${index}`} className="image-preview">
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={`새 이미지 ${index + 1}`}
                                />
                                <div className="image-tag">신규</div>
                                <button
                                    type="button"
                                    className="remove-image"
                                    onClick={() => handleRemoveNewImage(index)}
                                >
                                  ✕
                                </button>
                              </div>
                          ))
                      ) : (
                          <div>새 이미지가 없습니다.</div>
                      )}
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            </tbody>
          </table>

          <div className="form-buttons">
            <button
                type="submit"
                className="register-button"
                disabled={loading}
            >
              {loading ? '수정 중...' : '수정하기'}
            </button>
          </div>
        </form>
      </div>
  );
};

export default ProductEdit;