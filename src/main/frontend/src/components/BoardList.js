import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import API from "../utils/api";
import '../styles/boardList.css';

function BoardList({ apiEndpoint = '/board', title = '게시판', detailPathPrefix = '/board' }) {
    const [posts, setPosts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [pageSize] = useState(10);
    const navigate = useNavigate();

    // useCallback을 사용하여 fetchPosts 함수를 메모이제이션
    const fetchPosts = useCallback((page) => {
        API.get(`${apiEndpoint}?page=${page}&size=${pageSize}`)
            .then(response => {
                if (response.status === 200) {
                    console.log('Posts fetched:', response.data);
                    setPosts(response.data.data);
                    setTotalPages(response.data.totalPage);
                }
            })
            .catch(error => {
                console.error('Error fetching posts:', error);
            });
    }, [apiEndpoint, pageSize]);

    useEffect(() => {
        document.title = title;
        fetchPosts(currentPage);
    }, [currentPage, apiEndpoint, title, fetchPosts]);

    const handlePostClick = (id) => {
        navigate(`${detailPathPrefix}/${id}`);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // 페이지 번호 배열 생성
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    // 게시글 내용 일부만 표시하기 위한 함수
    const truncateContent = (content, maxLength = 100) => {
        if (content.length <= maxLength) return content;
        return content.slice(0, maxLength) + '...';
    };

    return (
        <div className="board-container">
            <h1 className="board-title">{title}</h1>
            <div className="board-list">
                {posts.map(post => (
                    <div key={post.id} className="post-item" onClick={() => handlePostClick(post.id)}>
                        <div className='thumbnail'>
                            <div className="post-images">
                                {post.images && post.images.length > 0 ? (
                                    <>
                                        <img 
                                            src={post.images[0]} 
                                            alt={`${post.title} 이미지`} 
                                            className="post-thumbnail" 
                                        />
                                        {post.images.length > 1 && (
                                            <span className="image-count">+{post.images.length - 1}</span>
                                        )}
                                    </>
                                ) : (
                                    <img 
                                        src="/images/blank_img.png" 
                                        alt="기본 이미지" 
                                        className="post-thumbnail blank" 
                                    />
                                )}
                            </div>
                        </div>
                        <div className="post-contents">
                            <div className="post-header">
                                <h2 className="post-title">{post.title}</h2>
                                <span className={`post-region ${post.region == "" ? "display_none" : ""}`}>{post.region}</span>
                            </div>
                            <div className='post-desc'>{truncateContent(post.content)}</div>
                            <div className="post-footer">
                                <span className="post-author">{post.name}</span>
                                <span className="post-date">
                                    {new Date(post.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        
                        
                    </div>
                ))}
            </div>
            
            <div className="pagination">
                <button 
                    className="pagination-button" 
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    이전
                </button>
                
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        className={`pagination-number ${currentPage === number ? 'active' : ''}`}
                        onClick={() => handlePageChange(number)}
                    >
                        {number}
                    </button>
                ))}
                
                <button 
                    className="pagination-button" 
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    다음
                </button>
            </div>
        </div>
    );
}

export default BoardList;   