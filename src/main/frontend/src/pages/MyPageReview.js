// pages/MyPageReview.js
import React, { useEffect, useState } from "react";
import MyPageHeader from "../components/MyPageHeader";
import API from "../utils/api";
import "../styles/mypage-review.css";

const MyPageReview = () => {
  const [activeTab, setActiveTab] = useState("reviewable"); // "reviewable" | "written"
  const [reviewableOrders, setReviewableOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [editStar, setEditStar] = useState(5);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [itemNames, setItemNames] = useState({});
  const [writingReview, setWritingReview] = useState(null);
  const [newReviewContent, setNewReviewContent] = useState("");
  const [newReviewStar, setNewReviewStar] = useState(5);
  const [newReviewImages, setNewReviewImages] = useState([]);

  useEffect(() => {
    if (activeTab === "reviewable") {
      fetchReviewableOrders();
    } else {
      fetchReviews(currentPage);
    }
  }, [activeTab, currentPage]);

  const fetchReviewableOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get(`/reviews/reviewable-orders`);

      if (response.data.success) {
        setReviewableOrders(response.data.content);
      } else {
        throw new Error(response.data.message || "리뷰 작성 가능한 주문 조회에 실패했습니다.");
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "리뷰 작성 가능한 주문 조회에 실패했습니다.");
      console.error("리뷰 작성 가능한 주문 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (page) => {
    try {
      setLoading(true);
      setError(null);

      const response = await API.get(`/reviews?page=${page}&size=10`);

      if (response.data.success) {
        const reviewList = response.data.content.list;
        setReviews(reviewList);
        setTotalPages(response.data.content.totalPage);

        // 각 리뷰의 상품명을 가져오기
        await fetchItemNames(reviewList);
      } else {
        throw new Error(response.data.message || "리뷰 조회에 실패했습니다.");
      }
    } catch (error) {
      setError(error.response?.data?.message || error.message || "리뷰 조회에 실패했습니다.");
      console.error("리뷰 조회 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemNames = async (reviewList) => {
    try {
      const itemIds = [...new Set(reviewList.map(review => review.itemId))];
      const itemNamesMap = {};

      // 각 상품 ID에 대해 상품 정보 조회
      for (const itemId of itemIds) {
        try {
          const response = await API.get(`/items/${itemId}`);
          if (response.data.success) {
            itemNamesMap[itemId] = response.data.content.name;
          }
        } catch (error) {
          console.error(`상품 ${itemId} 정보 조회 실패:`, error);
          itemNamesMap[itemId] = "상품 정보 없음";
        }
      }

      setItemNames(itemNamesMap);
    } catch (error) {
      console.error("상품명 조회 오류:", error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setError(null);
    setLoading(true);
  };

  const handleWriteReview = (item) => {
    setWritingReview(item);
    setNewReviewContent("");
    setNewReviewStar(5);
    setNewReviewImages([]);
  };

  const handleCreateReview = async () => {
    try {
      if (!newReviewContent.trim()) {
        alert("리뷰 내용을 입력해주세요.");
        return;
      }

      const formData = new FormData();
      const reviewData = {
        itemId: writingReview.itemId,
        content: newReviewContent,
        star: newReviewStar,
        parentId: null
      };

      formData.append("request", new Blob([JSON.stringify(reviewData)], { type: "application/json" }));

      // 이미지가 있으면 추가
      if (newReviewImages.length > 0) {
        newReviewImages.forEach((image) => {
          formData.append("images", image);
        });
      }

      await API.post("/reviews", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("리뷰가 작성되었습니다!");
      setWritingReview(null);
      setNewReviewContent("");
      setNewReviewStar(5);
      setNewReviewImages([]);

      // 리뷰 작성 가능한 주문 목록 새로고침
      fetchReviewableOrders();
    } catch (error) {
      alert(error.response?.data?.message || "리뷰 작성에 실패했습니다.");
      console.error("리뷰 작성 오류:", error);
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + newReviewImages.length > 5) {
      alert("이미지는 최대 5장까지 업로드할 수 있습니다.");
      return;
    }
    setNewReviewImages([...newReviewImages, ...files]);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = newReviewImages.filter((_, i) => i !== index);
    setNewReviewImages(updatedImages);
  };

  const handleViewReview = (review) => {
    setSelectedReview(review);
    setShowModal(true);
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditContent(review.content);
    setEditStar(review.star);
  };

  const handleUpdateReview = async () => {
    try {
      if (!editContent.trim()) {
        alert("리뷰 내용을 입력해주세요.");
        return;
      }

      const formData = new FormData();
      const updateData = {
        content: editContent,
        star: editStar
      };

      formData.append("update", new Blob([JSON.stringify(updateData)], { type: "application/json" }));

      await API.patch(`/reviews/${editingReview.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("리뷰가 수정되었습니다.");
      setEditingReview(null);
      setEditContent("");
      setEditStar(5);
      fetchReviews(currentPage);
    } catch (error) {
      alert(error.response?.data?.message || "리뷰 수정에 실패했습니다.");
      console.error("리뷰 수정 오류:", error);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    try {
      await API.delete(`/reviews/${reviewId}`);
      alert("리뷰가 삭제되었습니다.");
      setDeleteConfirm(null);
      fetchReviews(currentPage);
    } catch (error) {
      alert(error.response?.data?.message || "리뷰 삭제에 실패했습니다.");
      console.error("리뷰 삭제 오류:", error);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
          <span
              key={i}
              className={`star ${i <= rating ? "filled" : ""} ${interactive ? "interactive" : ""}`}
              onClick={interactive ? () => onStarClick(i) : undefined}
          >
          ★
        </span>
      );
    }
    return stars;
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 페이지 버튼
    pages.push(
        <button
            key="prev"
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
        >
          ‹
        </button>
    );

    // 페이지 번호 버튼들
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
          <button
              key={i}
              className={`pagination-btn ${currentPage === i ? "active" : ""}`}
              onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
      );
    }

    // 다음 페이지 버튼
    pages.push(
        <button
            key="next"
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
        >
          ›
        </button>
    );

    return pages;
  };

  const renderReviewableOrders = () => {
    if (reviewableOrders.length === 0) {
      return (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h3>리뷰 작성 가능한 주문이 없습니다</h3>
            <p>모든 구매 상품에 대한 리뷰를 작성했거나, 아직 주문이 완료되지 않았습니다.</p>
            <button
                className="go-store-btn"
                onClick={() => window.location.href = '/store'}
            >
              상품 보러가기
            </button>
          </div>
      );
    }

    return (
        <div className="reviewable-orders-container">
          <div className="section-header">
            <h3>리뷰 작성 가능한 주문 ({reviewableOrders.length}개)</h3>
            <p>완료된 주문 중 아직 리뷰를 작성하지 않은 상품들입니다.</p>
          </div>

          <div className="reviewable-orders-grid">
            {reviewableOrders.map((item, index) => (
                <div key={index} className="reviewable-order-card">
                  <div className="order-info">
                    <h4 className="item-name">{item.itemName}</h4>
                    <div className="order-details">
                      <span className="order-date">주문일: {formatDate(item.orderDate)}</span>
                      <span className="order-quantity">수량: {item.quantity}개</span>
                      <span className="order-price">가격: {item.price.toLocaleString()}원</span>
                    </div>
                  </div>
                  <button
                      className="write-review-btn"
                      onClick={() => handleWriteReview(item)}
                  >
                    리뷰 작성하기
                  </button>
                </div>
            ))}
          </div>
        </div>
    );
  };

  const renderWrittenReviews = () => {
    if (reviews.length === 0) {
      return (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>작성한 리뷰가 없습니다</h3>
            <p>구매한 상품에 대한 소중한 후기를 남겨주세요!</p>
            <button
                className="tab-switch-btn"
                onClick={() => setActiveTab("reviewable")}
            >
              리뷰 작성하러 가기
            </button>
          </div>
      );
    }

    return (
        <div className="written-reviews-container">
          <div className="section-header">
            <h3>작성한 리뷰 ({reviews.length}개)</h3>
            <div className="reviews-stats">
            <span className="stat-item">
              평균 평점: {reviews.length > 0
                ? (reviews.reduce((sum, review) => sum + review.star, 0) / reviews.length).toFixed(1)
                : 0
            }점
            </span>
            </div>
          </div>

          <div className="reviews-list">
            {reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-info">
                      <div className="review-item-info">
                    <span className="review-item-name">
                      {itemNames[review.itemId] || "상품 정보 로딩 중..."}
                    </span>
                        <span className="review-author">{review.name}</span>
                      </div>
                      <span className="review-date">{formatDate(review.createdAt)}</span>
                      {review.modifiedAt !== review.createdAt && (
                          <span className="review-modified">(수정됨)</span>
                      )}
                    </div>
                    <div className="review-rating">
                      {renderStars(review.star)}
                      <span className="rating-number">({review.star})</span>
                    </div>
                  </div>

                  <div className="review-content">
                    <p>{review.content}</p>
                  </div>

                  {review.images && review.images.length > 0 && (
                      <div className="review-images">
                        {review.images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`리뷰 이미지 ${index + 1}`}
                                className="review-image"
                                onClick={() => handleViewReview(review)}
                            />
                        ))}
                      </div>
                  )}

                  <div className="review-actions">
                    <button
                        className="action-btn view-btn"
                        onClick={() => handleViewReview(review)}
                    >
                      자세히 보기
                    </button>
                    <button
                        className="action-btn edit-btn"
                        onClick={() => handleEditReview(review)}
                    >
                      수정
                    </button>
                    <button
                        className="action-btn delete-btn"
                        onClick={() => setDeleteConfirm(review)}
                    >
                      삭제
                    </button>
                  </div>

                  {review.childReviews && review.childReviews.length > 0 && (
                      <div className="child-reviews">
                        <h4>답글</h4>
                        {review.childReviews.map((childReview) => (
                            <div key={childReview.id} className="child-review">
                              <div className="child-review-header">
                                <span className="child-review-author">{childReview.name}</span>
                                <span className="child-review-date">{formatDate(childReview.createdAt)}</span>
                              </div>
                              <div className="child-review-content">
                                <p>{childReview.content}</p>
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </div>
            ))}
          </div>

          {totalPages > 1 && (
              <div className="pagination">
                {renderPagination()}
              </div>
          )}
        </div>
    );
  };

  if (loading) {
    return (
        <div className="mypage_main">
          <MyPageHeader />
          <div className="mypage_contents">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>{activeTab === "reviewable" ? "리뷰 작성 가능한 주문을" : "작성한 리뷰를"} 불러오는 중...</p>
            </div>
          </div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="mypage_main">
          <MyPageHeader />
          <div className="mypage_contents">
            <div className="error-container">
              <p className="error-message">⚠️ {error}</p>
              <button
                  className="retry-btn"
                  onClick={() => activeTab === "reviewable" ? fetchReviewableOrders() : fetchReviews(currentPage)}
              >
                다시 시도
              </button>
            </div>
          </div>
        </div>
    );
  }

  return (
      <div className="mypage_main">
        <MyPageHeader />

        <div className="mypage_contents">
          <div className="title">리뷰/후기 관리</div>

          {/* 탭 네비게이션 */}
          <div className="tab-navigation">
            <button
                className={`tab-button ${activeTab === "reviewable" ? "active" : ""}`}
                onClick={() => handleTabChange("reviewable")}
            >
              리뷰 작성하기 ({reviewableOrders.length})
            </button>
            <button
                className={`tab-button ${activeTab === "written" ? "active" : ""}`}
                onClick={() => handleTabChange("written")}
            >
              작성한 리뷰
            </button>
          </div>

          {/* 탭 콘텐츠 */}
          <div className="tab-content">
            {activeTab === "reviewable" ? renderReviewableOrders() : renderWrittenReviews()}
          </div>
        </div>

        {/* 리뷰 작성 모달 */}
        {writingReview && (
            <div className="modal-overlay" onClick={() => setWritingReview(null)}>
              <div className="modal-content write-review-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>리뷰 작성</h3>
                  <button className="modal-close" onClick={() => setWritingReview(null)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="write-review-form">
                    {/* 상품 정보 */}
                    <div className="product-info">
                      <h4>{writingReview.itemName}</h4>
                      <div className="order-info-detail">
                        <span>주문일: {formatDate(writingReview.orderDate)}</span>
                        <span>수량: {writingReview.quantity}개</span>
                        <span>가격: {writingReview.price.toLocaleString()}원</span>
                      </div>
                    </div>

                    {/* 평점 선택 */}
                    <div className="form-group">
                      <label>평점 <span className="required">*</span></label>
                      <div className="star-rating">
                        {renderStars(newReviewStar, true, setNewReviewStar)}
                        <span className="rating-text">({newReviewStar}점)</span>
                      </div>
                    </div>

                    {/* 리뷰 내용 */}
                    <div className="form-group">
                      <label>리뷰 내용 <span className="required">*</span></label>
                      <textarea
                          value={newReviewContent}
                          onChange={(e) => setNewReviewContent(e.target.value)}
                          placeholder="상품에 대한 솔직한 후기를 남겨주세요. (최소 10자 이상)"
                          rows={6}
                          maxLength={1000}
                      />
                      <div className="char-count">
                        {newReviewContent.length}/1000자
                      </div>
                    </div>

                    {/* 이미지 업로드 */}
                    <div className="form-group">
                      <label>사진 첨부 (선택)</label>
                      <div className="image-upload-area">
                        <input
                            type="file"
                            id="review-images"
                            multiple
                            accept="image/*"
                            onChange={handleImageUpload}
                            style={{ display: 'none' }}
                        />
                        <label htmlFor="review-images" className="upload-button">
                          📷 사진 추가 ({newReviewImages.length}/5)
                        </label>
                        <span className="upload-hint">최대 5장까지 업로드 가능</span>
                      </div>

                      {/* 업로드된 이미지 미리보기 */}
                      {newReviewImages.length > 0 && (
                          <div className="image-preview-container">
                            {newReviewImages.map((image, index) => (
                                <div key={index} className="image-preview">
                                  <img
                                      src={URL.createObjectURL(image)}
                                      alt={`미리보기 ${index + 1}`}
                                      className="preview-image"
                                  />
                                  <button
                                      type="button"
                                      className="remove-image-btn"
                                      onClick={() => handleRemoveImage(index)}
                                  >
                                    ×
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>

                    {/* 작성 가이드 */}
                    <div className="review-guide">
                      <h5>📝 리뷰 작성 가이드</h5>
                      <ul>
                        <li>상품의 품질, 사이즈, 착용감 등을 자세히 알려주세요</li>
                        <li>다른 구매자들에게 도움이 되는 정보를 포함해주세요</li>
                        <li>욕설이나 비방은 삭제될 수 있습니다</li>
                      </ul>
                    </div>

                    <div className="form-actions">
                      <button
                          className="cancel-btn"
                          onClick={() => setWritingReview(null)}
                      >
                        취소
                      </button>
                      <button
                          className="submit-review-btn"
                          onClick={handleCreateReview}
                          disabled={!newReviewContent.trim() || newReviewContent.length < 10}
                      >
                        리뷰 작성 완료
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* 리뷰 상세보기 모달 */}
        {showModal && selectedReview && (
            <div className="modal-overlay" onClick={() => setShowModal(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>리뷰 상세보기</h3>
                  <button className="modal-close" onClick={() => setShowModal(false)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="modal-review-info">
                    <div className="modal-rating">
                      {renderStars(selectedReview.star)}
                      <span>({selectedReview.star})</span>
                    </div>
                    <div className="modal-date">{formatDate(selectedReview.createdAt)}</div>
                  </div>
                  <div className="modal-content-text">
                    <p>{selectedReview.content}</p>
                  </div>
                  {selectedReview.images && selectedReview.images.length > 0 && (
                      <div className="modal-images">
                        {selectedReview.images.map((image, index) => (
                            <img
                                key={index}
                                src={image}
                                alt={`리뷰 이미지 ${index + 1}`}
                                className="modal-image"
                            />
                        ))}
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}

        {/* 리뷰 수정 모달 */}
        {editingReview && (
            <div className="modal-overlay" onClick={() => setEditingReview(null)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>리뷰 수정</h3>
                  <button className="modal-close" onClick={() => setEditingReview(null)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <div className="edit-form">
                    <div className="form-group">
                      <label>평점</label>
                      <div className="star-rating">
                        {renderStars(editStar, true, setEditStar)}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>리뷰 내용</label>
                      <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          placeholder="리뷰 내용을 입력하세요..."
                          rows={6}
                      />
                    </div>
                    <div className="form-actions">
                      <button
                          className="cancel-btn"
                          onClick={() => setEditingReview(null)}
                      >
                        취소
                      </button>
                      <button
                          className="save-btn"
                          onClick={handleUpdateReview}
                      >
                        수정 완료
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* 삭제 확인 모달 */}
        {deleteConfirm && (
            <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
              <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>리뷰 삭제</h3>
                  <button className="modal-close" onClick={() => setDeleteConfirm(null)}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <p>정말로 이 리뷰를 삭제하시겠습니까?</p>
                  <p className="warning-text">삭제된 리뷰는 복구할 수 없습니다.</p>
                  <div className="form-actions">
                    <button
                        className="cancel-btn"
                        onClick={() => setDeleteConfirm(null)}
                    >
                      취소
                    </button>
                    <button
                        className="delete-btn"
                        onClick={() => handleDeleteReview(deleteConfirm.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
};

export default MyPageReview;