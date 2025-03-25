import React, { useState, useEffect, useCallback } from 'react';
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
    const [userId, setUserId] = useState('');
    const navigate = useNavigate();

    // 사용자 정보 가져오기
    useEffect(() => {
        // 로컬 스토리지에서 사용자 정보 가져오기
        const userInfo = localStorage.getItem('userInfo');
        if (userInfo) {
            try {
                const parsedUserInfo = JSON.parse(userInfo);
                setUserId(parsedUserInfo.id || '');
            } catch (e) {
                console.error('사용자 정보 파싱 오류:', e);
            }
        } else {
            // 사용자 정보 API 호출
            const fetchUserInfo = async () => {
                try {
                    const response = await API.get('/user/info');
                    if (response.status === 200) {
                        setUserId(response.data.id || '');
                        // 필요하다면 로컬 스토리지에 저장
                        localStorage.setItem('userInfo', JSON.stringify(response.data));
                    }
                } catch (error) {
                    console.error('사용자 정보 가져오기 실패:', error);
                }
            };
            
            fetchUserInfo();
        }
    }, []);

    // fetchPostData 함수를 useCallback으로 메모이제이션
    const fetchPostData = useCallback(async () => {
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
        
        // 사용자 ID 체크 (뉴스 API에만 필요)
        if (apiEndpoint === '/news' && !userId) {
            setError('사용자 정보를 가져올 수 없습니다. 다시 로그인해주세요.');
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            let response;
            
            // 수정 모드
            if (isEditMode) {
                // API 요청
                if (apiEndpoint === '/news') {
                    // 뉴스 API는 다른 형식으로 처리
                    const newsData = {
                        request: {
                            title: formData.title,
                            content: formData.content
                        },
                        images: formData.images
                    };
                    
                    response = await API.put(`${apiEndpoint}/${id}?id=${userId}`, newsData);
                } else {
                    // 일반 게시판 API
                    const formDataObj = new FormData();
                    formDataObj.append('title', formData.title);
                    formDataObj.append('content', formData.content);
                    formDataObj.append('region', formData.region);
                    
                    // 기존 이미지 정보
                    formDataObj.append('images', JSON.stringify(formData.images));
                    
                    // 새로 추가된 이미지 파일
                    selectedFiles.forEach(file => {
                        formDataObj.append('files', file);
                    });
                    
                    response = await API.put(`${apiEndpoint}/${id}`, formDataObj, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                }
            } 
            // 새 글 작성 모드
            else {
                if (apiEndpoint === '/news') {
                    // 이미지 파일을 base64로 변환
                    const base64Promises = selectedFiles.map(file => {
                        return new Promise((resolve) => {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                                const base64String = reader.result.split(',')[1];
                                resolve(base64String);
                            };
                            reader.readAsDataURL(file);
                        });
                    });
                    
                    const base64Images = await Promise.all(base64Promises);
                    
                    // 뉴스 API 요청 형식에 맞게 데이터 준비
                    const newsData = {
                        request: {
                            title: formData.title,
                            content: formData.content
                        },
                        images: base64Images
                    };
                    
                    const currentUserId = userId || '14'; // 기본값 설정 (보안상 좋지 않지만 임시 조치)
                    response = await API.post(`${apiEndpoint}?id=${currentUserId}`, newsData);
                } else {
                    // 일반 게시판 API
                    const formDataObj = new FormData();
                    formDataObj.append('title', formData.title);
                    formDataObj.append('content', formData.content);
                    formDataObj.append('region', formData.region);
                    
                    // 이미지 파일 첨부
                    selectedFiles.forEach(file => {
                        formDataObj.append('files', file);
                    });
                    
                    response = await API.post(apiEndpoint, formDataObj, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                }
                
                if (response.status === 200 || response.status === 201) {
                    // 성공 시 게시글 목록 또는 상세 페이지로 이동
                    if (apiEndpoint === '/news') {
                        navigate('/news'); // 뉴스 목록으로 이동
                    } else {
                        const redirectId = isEditMode ? id : response.data.id;
                        navigate(`${apiEndpoint.startsWith('/') ? apiEndpoint : '/' + apiEndpoint}/${redirectId}`);
                    }
                }
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