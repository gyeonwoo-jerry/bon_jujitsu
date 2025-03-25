import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../utils/api';
import '../styles/boardDetail.css';

function BoardDetail({ apiEndpoint = '/board' }) {
    const { id } = useParams(); // URL에서 게시글 ID를 가져옵니다.
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // 게시글 ID가 있을 때만 API를 호출합니다.
        if (id) {
            fetchPostDetail();
        }
    }, [id, apiEndpoint]);

    const fetchPostDetail = async () => {
        try {
            setLoading(true);
            const response = await API.get(`${apiEndpoint}/${id}`);
            if (response.status === 200) {
                console.log('Post detail fetched:', response.data);
                setPost(response.data);
                document.title = response.data.title || '게시글 상세';
            }
        } catch (err) {
            console.error('Error fetching post detail:', err);
            setError('게시글을 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoBack = () => {
        navigate(-1); // 이전 페이지로 이동
    };

    // 로딩 중인 경우
    if (loading) {
        return <div className="loading">게시글을 불러오는 중...</div>;
    }

    // 오류가 발생한 경우
    if (error) {
        return <div className="error">{error}</div>;
    }

    // 게시글 데이터가 없는 경우
    if (!post) {
        return <div className="not-found">게시글을 찾을 수 없습니다.</div>;
    }

    return (
        <div className="board-detail-container">
            <button className="back-button" onClick={handleGoBack}>
                &larr; 목록으로
            </button>
            
            <div className="post-detail-header">
                <h1 className="post-detail-title">{post.title}</h1>
                <div className="post-detail-meta">
                    <span className="post-detail-region">{post.region}</span>
                    <span className="post-detail-author">{post.name}</span>
                    <span className="post-detail-date">
                        {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                </div>
            </div>
            
            <div className="post-detail-content">
                {post.content && (
                    <div className="post-detail-text">
                        {post.content.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>
                )}
                
                {post.images && post.images.length > 0 && (
                    <div className="post-detail-images">
                        {post.images.map((image, index) => (
                            <div key={index} className="post-detail-image-container">
                                <img 
                                    src={image} 
                                    alt={`${post.title} 이미지 ${index + 1}`} 
                                    className="post-detail-image" 
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BoardDetail; 