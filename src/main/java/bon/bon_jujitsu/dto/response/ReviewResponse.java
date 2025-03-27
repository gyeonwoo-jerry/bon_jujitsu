package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Review;
import bon.bon_jujitsu.domain.ReviewImage;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public record ReviewResponse (
    Long id,
    String content,
    double star,
    int depth,
    Long parentId,
    String name,
    Long itemId,
    Long orderId, // 주문 ID 추가 여부 결정 필요
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt,
    List<ReviewResponse> childReviews
) {
  public ReviewResponse (Review review, List<ReviewResponse> childReviews) {
    this(
        review.getId(),
        review.getContent(),
        review.getStar(),
        review.getDepth(),
        Optional.ofNullable(review.getParentReview()).map(Review::getId).orElse(null),
        review.getUser().getName(),
        review.getItem().getId(),
        review.getOrder() != null ? review.getOrder().getId() : null, // 주문 ID 추가 여부 확인 필요
        review.getImages().stream().map(ReviewImage::getImagePath).toList(),
        review.getCreatedAt(),
        review.getModifiedAt(),
        childReviews
    );
  }
}
