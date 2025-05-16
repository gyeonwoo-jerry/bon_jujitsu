import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../utils/api';
import { getWithExpiry } from '../../utils/storage';
import '../../styles/admin/productForm.css';

const ProductCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [error, setError] = useState(null);
  const [nameChecked, setNameChecked] = useState(false);
  const [nameCheckMessage, setNameCheckMessage] = useState('');
  const [nameCheckStatus, setNameCheckStatus] = useState(null); // true: 사용가능, false: 중복, null: 미확인
  const fileInputRef = useRef(null);

  // 상품 정보 상태
  const [productData, setProductData] = useState({
    name: '',
    content: '',
    price: '',
    sale: '',
    options: [{ size: '', color: '', amount: '1' }],
    images: []
  });

  // 자주 사용하는 색상 프리셋
  const colorPresets = [
    'BLACK', 'WHITE', 'RED', 'BLUE', 'GREEN', 'YELLOW', 'NAVY', 'GRAY', 'BEIGE', 'BROWN', 'PINK', 'PURPLE', 'ORANGE'
  ];

  // 이미지 미리보기 URL
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);

  // 상품 정보 입력 핸들러
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === 'name') {
      // 상품명이 변경되면 중복 확인 상태 초기화
      setNameChecked(false);
      setNameCheckMessage('');
      setNameCheckStatus(null);
    }

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

  // 상품명 중복 확인
  const handleNameCheck = async () => {
    if (!productData.name.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }

    setCheckingName(true);

    try {
      const res = await API.get(`/items/check-name?name=${encodeURIComponent(productData.name)}`);

      if (res.data?.success) {
        const { isDuplicate, message } = res.data.content;
        setNameCheckStatus(!isDuplicate); // true면 사용 가능, false면 중복
        setNameCheckMessage(message);
        setNameChecked(true);

        // 알림 표시
        alert(message);
      } else {
        setNameCheckMessage('중복 확인 중 오류가 발생했습니다.');
        setNameCheckStatus(null);
        alert('중복 확인 실패: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('상품명 중복 확인 오류:', err);
      setNameCheckMessage('중복 확인 중 오류가 발생했습니다.');
      setNameCheckStatus(null);
      alert('중복 확인 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setCheckingName(false);
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
      options: [...prev.options, { size: '', color: '', amount: '1' }]
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

    // 최대 5개 이미지 파일 제한
    if (files.length + productData.images.length > 5) {
      alert('이미지는 최대 5개까지 업로드할 수 있습니다.');
      return;
    }

    setProductData(prev => ({
      ...prev,
      images: [...prev.images, ...files]
    }));

    // 이미지 미리보기 URL 생성
    const newImagePreviewUrls = files.map(file => URL.createObjectURL(file));
    setImagePreviewUrls(prev => [...prev, ...newImagePreviewUrls]);
  };

  // 이미지 업로드 버튼 클릭 핸들러
  const handleImageUploadClick = () => {
    fileInputRef.current.click();
  };

  // 이미지 제거 핸들러
  const handleRemoveImage = (index) => {
    setProductData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));

    // 미리보기 URL 제거 및 리소스 해제
    URL.revokeObjectURL(imagePreviewUrls[index]);
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 필수 입력값 검증
    if (!productData.name || !productData.price) {
      setError('상품명과 가격은 필수 입력 항목입니다.');
      return;
    }

    // 상품명 중복 확인 여부 검증
    if (!nameChecked || nameCheckStatus === false) {
      setError('상품명 중복 확인이 필요합니다.');
      return;
    }

    // 옵션 검증
    for (const option of productData.options) {
      if (!option.size) {
        setError('모든 옵션의 사이즈를 입력해주세요.');
        return;
      }

      if (!option.color) {
        setError('모든 옵션의 색상을 입력해주세요.');
        return;
      }

      if (!option.amount || parseInt(option.amount) <= 0) {
        setError('모든 옵션의 수량을 1개 이상 입력해주세요.');
        return;
      }
    }

    // 토큰 확인
    const token = getWithExpiry("accessToken");
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 요청 데이터 생성
      const formData = new FormData();

      // 상품 정보를 JSON 문자열로 변환하여 request 파트에 추가
      const itemRequest = {
        name: productData.name,
        content: productData.content,
        price: parseInt(productData.price),
        sale: productData.sale ? parseInt(productData.sale) : parseInt(productData.price),
        options: productData.options.map(option => ({
          size: option.size || "NONE",  // 백엔드 로직에 맞게 기본값 처리
          color: option.color || "DEFAULT", // 백엔드 로직에 맞게 기본값 처리
          amount: parseInt(option.amount)
        }))
      };

      console.log('요청 데이터:', itemRequest);

      // JSON 문자열로 변환하여 FormData에 추가
      const requestBlob = new Blob([JSON.stringify(itemRequest)], { type: 'application/json' });
      formData.append('request', requestBlob);

      // 이미지 파일 추가
      if (productData.images.length > 0) {
        productData.images.forEach(image => {
          formData.append('images', image);
        });
      }

      // API 요청
      const res = await API.post('/items', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data?.success) {
        alert('상품이 성공적으로 등록되었습니다.');
        navigate('/admin/products');
      } else {
        setError('상품 등록에 실패했습니다: ' + (res.data?.message || '알 수 없는 오류'));
      }
    } catch (err) {
      console.error('상품 등록 오류:', err);
      setError('상품 등록 중 오류가 발생했습니다: ' + (err.message || '알 수 없는 오류'));
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 언마운트 시 미리보기 URL 리소스 해제
  useEffect(() => {
    return () => {
      imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
      <div className="product-form-container">
        <h2 className="title">상품관리(상품등록)</h2>

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
                <div className="name-check-container">
                  <input
                      type="text"
                      name="name"
                      value={productData.name}
                      onChange={handleInputChange}
                      className="name-input"
                      required
                  />
                  <button
                      type="button"
                      className="name-check-button"
                      onClick={handleNameCheck}
                      disabled={checkingName || !productData.name.trim()}
                  >
                    {checkingName ? '확인 중...' : '상품명 중복확인'}
                  </button>
                </div>
                {nameCheckMessage && (
                    <div className={`name-check-message ${nameCheckStatus ? 'success' : 'error'}`}>
                      {nameCheckMessage}
                    </div>
                )}
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
                              // 첫 번째 옵션에 색상 적용
                              if (productData.options.length > 0) {
                                applyPresetColor(0, color);
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
                <button
                    type="button"
                    className="image-upload-button"
                    onClick={handleImageUploadClick}
                >
                  이미지 등록
                </button>
                <div className="image-preview-container">
                  {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="image-preview">
                        <img src={url} alt={`상품 이미지 ${index + 1}`} />
                        <button
                            type="button"
                            className="remove-image"
                            onClick={() => handleRemoveImage(index)}
                        >
                          ✕
                        </button>
                      </div>
                  ))}
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
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
  );
};

export default ProductCreate;