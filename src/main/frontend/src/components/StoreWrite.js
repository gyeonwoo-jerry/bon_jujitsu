import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import '../styles/storeWrite.css';

const StoreWrite = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    content: '',
    price: '',
    sale: 0,
    amount: '',
  });
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 입력 필드 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: ['price', 'sale', 'amount'].includes(name) ? Number(value) : value
    });
  };

  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // 유효성 검사
      if (!formData.name || !formData.price || !formData.content || !formData.amount) {
        throw new Error('상품명, 가격, 설명, 수량은 필수 입력 항목입니다.');
      }
      
      // FormData 생성
      const newsFormData = new FormData();

      // JSON 데이터를 Blob으로 변환하여 추가
      const jsonBlob = new Blob(
        [
          JSON.stringify({
            name: formData.name,
            size: formData.size || "기본 사이즈",
            content: formData.content,
            price: Number(formData.price),
            sale: Number(formData.sale),
            amount: Number(formData.amount)
          }),
        ],
        { type: "application/json" }
      );

      // 선택한 파일이 있는 경우 FormData에 추가
      if (file) {
        newsFormData.append("images", file); // 'images' 키로 파일 추가
      }
      
      newsFormData.append("request", jsonBlob);
      
      console.log('상품 데이터 전송 준비 완료');
      
      // API 요청 보내기
      const response = await API.post('/items', newsFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log('상품 등록 성공:', response.data);
      alert('상품이 성공적으로 등록되었습니다.');
      navigate('/store');
    } catch (error) {
      console.error('상품 등록 오류:', error);
      
      if (error.response) {
        console.log('API 오류 상세:');
        console.log('- 상태 코드:', error.response.status);
        console.log('- 응답 데이터:', error.response.data);
        
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            `서버 오류 (${error.response.status})`;
        setError(errorMessage);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('상품 등록 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 취소 버튼 핸들러
  const handleCancel = () => {
    navigate('/store');
  };

  return (
    <div className="store-write-container">
      <form onSubmit={handleSubmit} className="store-write-form">
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">상품명 *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="size">사이즈</label>
          <input
            type="text"
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            placeholder="예: S, M, L 또는 상세 사이즈"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="price">가격 (원) *</label>
          <input
            type="number"
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="sale">할인율 (%)</label>
          <input
            type="number"
            id="sale"
            name="sale"
            value={formData.sale}
            onChange={handleChange}
            min="0"
            max="100"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="amount">재고 수량 *</label>
          <input
            type="number"
            id="amount"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            min="0"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">상품 설명 *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="5"
            required
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="image">상품 이미지</label>
          <input
            type="file"
            id="image"
            name="image"
            onChange={handleFileChange}
            accept="image/*"
          />
          {previewImage && (
            <div className="image-preview">
              <img src={previewImage} alt="상품 이미지 미리보기" />
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleCancel} 
            className="cancel-btn"
            disabled={loading}
          >
            취소
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? '등록 중...' : '상품 등록'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StoreWrite;
