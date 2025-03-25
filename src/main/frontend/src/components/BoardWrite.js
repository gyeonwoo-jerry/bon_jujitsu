import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import '../styles/boardWrite.css';

function BoardWrite({ apiEndpoint = '/board', title = '게시글 작성' }) {
    const { id } = useParams(); // 수정 모드일 경우 게시글 ID
    const [isEditMode, setIsEditMode] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        region: '',
        images: []
    });
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        document.title = id ? '게시글 수정' : title;
        
        // 수정 모드인 경우 기존 게시글 데이터 불러오기
        if (id) {
            setIsEditMode(true);
            fetchPostData();
        }
    }, [id, title]);

    const fetchPostData = async () => {
        try {
            setLoading(true);
            const response = await API.get(`${apiEndpoint}/${id}`);
            if (response.status === 200) {
                const postData = response.data;
                setFormData({
                    title: postData.title || '',
                    content: postData.content || '',
                    region: postData.region || '',
                    images: postData.images || []
                });
                // 기존 이미지 미리보기 설정
                setPreviewImages(postData.images || []);
            }
        } catch (error) {
            console.error('게시글 데이터 불러오기 실패:', error);
            setError('게시글 데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(prev => [...prev, ...files]);
        
        // 이미지 미리보기 생성
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                setPreviewImages(prev => [...prev, event.target.result]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        // 미리보기 이미지 삭제
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        
        // 새로 선택한 파일인 경우
        if (index < selectedFiles.length) {
            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        } 
        // 기존 이미지인 경우
        else if (isEditMode) {
            const existingImageIndex = index - selectedFiles.length;
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== existingImageIndex)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 유효성 검사
        if (!formData.title.trim()) {
            setError('제목을 입력해주세요.');
            return;
        }
        
        if (!formData.content.trim()) {
            setError('내용을 입력해주세요.');
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            // FormData 객체 생성
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('content', formData.content);
            submitData.append('region', formData.region);
            
            // 파일 추가
            selectedFiles.forEach(file => {
                submitData.append('files', file);
            });
            
            // 기존 이미지 추가 (수정 모드인 경우)
            if (isEditMode && formData.images.length > 0) {
                submitData.append('existingImages', JSON.stringify(formData.images));
            }
            
            let response;
            if (isEditMode) {
                // 수정 모드
                response = await API.put(`${apiEndpoint}/${id}`, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // 작성 모드
                response = await API.post(apiEndpoint, submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            
            if (response.status === 200 || response.status === 201) {
                // 성공 시 게시글 목록 또는 상세 페이지로 이동
                const redirectId = isEditMode ? id : response.data.id;
                navigate(`${apiEndpoint.startsWith('/') ? apiEndpoint : '/' + apiEndpoint}/${redirectId}`);
            }
        } catch (error) {
            console.error('게시글 저장 실패:', error);
            setError('게시글을 저장하는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (window.confirm('작성 중인 내용이 저장되지 않습니다. 정말 취소하시겠습니까?')) {
            navigate(-1); // 이전 페이지로 이동
        }
    };

    if (loading && isEditMode) {
        return <div className="loading">게시글 정보를 불러오는 중...</div>;
    }

    return (
        <div className="board-write-container">
            <h1 className="board-write-title">{isEditMode ? '게시글 수정' : title}</h1>
            
            {error && <div className="error-message">{error}</div>}
            
            <form className="board-write-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="region">지역</label>
                    <select 
                        id="region" 
                        name="region" 
                        value={formData.region} 
                        onChange={handleInputChange}
                    >
                        <option value="">지역 선택</option>
                        <option value="서울">서울</option>
                        <option value="경기">경기</option>
                        <option value="인천">인천</option>
                        <option value="부산">부산</option>
                        <option value="대구">대구</option>
                        <option value="대전">대전</option>
                        <option value="광주">광주</option>
                        <option value="울산">울산</option>
                        <option value="강원">강원</option>
                        <option value="충북">충북</option>
                        <option value="충남">충남</option>
                        <option value="전북">전북</option>
                        <option value="전남">전남</option>
                        <option value="경북">경북</option>
                        <option value="경남">경남</option>
                        <option value="제주">제주</option>
                    </select>
                </div>
                
                <div className="form-group">
                    <label htmlFor="title">제목</label>
                    <input 
                        type="text" 
                        id="title" 
                        name="title" 
                        value={formData.title} 
                        onChange={handleInputChange} 
                        placeholder="제목을 입력하세요"
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="content">내용</label>
                    <textarea 
                        id="content" 
                        name="content" 
                        value={formData.content} 
                        onChange={handleInputChange} 
                        placeholder="내용을 입력하세요"
                        rows="10"
                    ></textarea>
                </div>
                
                <div className="form-group">
                    <label htmlFor="images">이미지 첨부</label>
                    <input 
                        type="file" 
                        id="images" 
                        name="images" 
                        onChange={handleFileChange} 
                        multiple 
                        accept="image/*"
                    />
                    <div className="image-preview-container">
                        {previewImages.map((src, index) => (
                            <div className="image-preview" key={index}>
                                <img src={src} alt={`미리보기 ${index + 1}`} />
                                <button 
                                    type="button" 
                                    className="remove-image" 
                                    onClick={() => removeImage(index)}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="form-actions">
                    <button 
                        type="button" 
                        className="cancel-button" 
                        onClick={handleCancel}
                    >
                        취소
                    </button>
                    <button 
                        type="submit" 
                        className="submit-button" 
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : (isEditMode ? '수정하기' : '등록하기')}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default BoardWrite; 