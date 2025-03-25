import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API from '../utils/api';
import axios from 'axios'; // axios 직접 import
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
    // 고정된 userId로 설정
    const [userId] = useState('14'); // 기본값 14로 고정, API 요청없이 직접 설정
    const navigate = useNavigate();
    const isMounted = useRef(true);

    // 컴포넌트 언마운트 시 isMounted 플래그 업데이트
    useEffect(() => {
        return () => {
            isMounted.current = false;
        };
    }, []);

    // fetchPostData 함수를 useCallback으로 메모이제이션
    const fetchPostData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await API.get(`${apiEndpoint}/${id}`);
            // 컴포넌트가 마운트된 상태인지 확인
            if (!isMounted.current) return;
            
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
            if (isMounted.current) {
                console.error('게시글 데이터 불러오기 실패:', error);
                setError('게시글 데이터를 불러오는 중 오류가 발생했습니다.');
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
        }
    }, [apiEndpoint, id]);

    useEffect(() => {
        document.title = id ? '게시글 수정' : title;
        
        // 수정 모드인 경우 기존 게시글 데이터 불러오기
        if (id) {
            setIsEditMode(true);
            fetchPostData();
        }
    }, [id, title, fetchPostData]);

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
                if (isMounted.current) {
                    setPreviewImages(prev => [...prev, event.target.result]);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index) => {
        setPreviewImages(prev => prev.filter((_, i) => i !== index));
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        
        // 수정 모드에서 기존 이미지 삭제 처리
        if (isEditMode) {
            setFormData(prev => ({
                ...prev,
                images: prev.images.filter((_, i) => i !== index)
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError('');
            
            // 기본 유효성 검사
            if (!formData.title.trim()) {
                setError('제목을 입력해주세요.');
                setLoading(false);
                return;
            }
            
            if (!formData.content.trim()) {
                setError('내용을 입력해주세요.');
                setLoading(false);
                return;
            }
            
            if (apiEndpoint !== '/news' && !formData.region) {
                setError('지역을 선택해주세요.');
                setLoading(false);
                return;
            }
            
            let response;
            let base64Images = [];
            
            // 이미지 파일이 있는 경우 base64로 변환
            if (selectedFiles.length > 0) {
                const convertToBase64 = (file) => {
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = (error) => reject(error);
                        reader.readAsDataURL(file);
                    });
                };
                
                const base64Promises = selectedFiles.map(file => convertToBase64(file));
                base64Images = await Promise.all(base64Promises);
            }
            
            // 뉴스 API는 다른 형식으로 데이터 전송
            if (apiEndpoint === '/news') {
                const newsData = {
                    request: {
                        title: formData.title,
                        content: formData.content,
                        userId: userId
                    },
                    images: base64Images
                };
                
                console.log('뉴스 등록 요청 데이터:', newsData);
                
                // 백엔드 API 서버 URL 직접 지정 (CORS 이슈가 있을 수 있음)
                // 개발환경 프록시 설정 확인 필요
                const API_BASE_URL = 'http://211.110.44.79:58080/api'; // 백엔드 서버 URL
                console.log('요청 URL:', `${API_BASE_URL}${apiEndpoint}?id=${userId}`);
                
                // API.post 대신 axios 직접 사용
                response = await axios.post(`${API_BASE_URL}${apiEndpoint}?id=${userId}`, newsData, {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                console.log('API 응답:', response);
            } else {
                // 일반 게시글 등록/수정 로직
                const postData = {
                    title: formData.title,
                    content: formData.content,
                    region: formData.region,
                    images: base64Images
                };
                
                if (isEditMode) {
                    response = await API.put(`${apiEndpoint}/${id}`, postData);
                } else {
                    response = await API.post(apiEndpoint, postData);
                }
            }
            
            if (response.status === 200 || response.status === 201) {
                // 성공 시 게시글 목록 또는 상세 페이지로 이동
                if (apiEndpoint === '/news') {
                    // 뉴스 목록으로 이동
                    navigate('/news');
                } else {
                    // ID가 있으면 해당 게시글의 상세 페이지로, 없으면 목록으로 이동
                    const redirectId = isEditMode ? id : response.data.id;
                    navigate(`${apiEndpoint.startsWith('/') ? apiEndpoint : '/' + apiEndpoint}/${redirectId}`);
                }
            }
        } catch (error) {
            if (isMounted.current) {
                console.error('게시글 저장 실패:', error);
                console.error('에러 세부정보:', error.response ? error.response.data : '응답 데이터 없음');
                setError(`게시글을 저장하는 중 오류가 발생했습니다: ${error.message}`);
            }
        } finally {
            if (isMounted.current) {
                setLoading(false);
            }
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
                {apiEndpoint !== '/news' && (
                    <div className="form-group">
                        <label htmlFor="region">지역</label>
                        <select 
                            id="region" 
                            name="region" 
                            value={formData.region} 
                            onChange={handleInputChange}
                        >
                            <option value="">지역 선택</option>
                            <option value="서울특별시">서울특별시</option>
                            <option value="경기도">경기도</option>
                            <option value="인천광역시">인천광역시</option>
                            <option value="부산광역시">부산광역시</option>
                            <option value="대구광역시">대구광역시</option>
                            <option value="대전광역시">대전광역시</option>
                            <option value="광주광역시">광주광역시</option>
                            <option value="울산광역시">울산광역시</option>
                            <option value="강원도">강원도</option>
                            <option value="충청북도">충청북도</option>
                            <option value="충청남도">충청남도</option>
                            <option value="전라북도">전라북도</option>
                            <option value="전라남도">전라남도</option>
                            <option value="경상북도">경상북도</option>
                            <option value="경상남도">경상남도</option>
                            <option value="제주특별자치도">제주특별자치도</option>
                        </select>
                    </div>
                )}
                
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