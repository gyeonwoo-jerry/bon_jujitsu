package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Review;
import bon.bon_jujitsu.domain.ReviewImage;

import java.time.LocalDateTime;
import java.util.ArrayList;
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
    Long orderId,
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt,
    List<ReviewResponse> childReviews
) {
  public ReviewResponse {
    // 방어적 복사를 통해 변경 가능한 리스트 생성
    childReviews = new ArrayList<>(childReviews);
  }

  public ReviewResponse(Review review, List<ReviewResponse> childReviews) {
    this(
        review.getId(),
        review.getContent(),
        review.getStar(),
        review.getDepth(),
        Optional.ofNullable(review.getParentReview()).map(Review::getId).orElse(null),
        review.getUser().getName(),
        review.getItem().getId(),
        review.getOrder() != null ? review.getOrder().getId() : null,
        review.getImages().stream().map(ReviewImage::getImagePath).toList(),
        review.getCreatedAt(),
        review.getModifiedAt(),
        new ArrayList<>(childReviews) // 변경 가능한 리스트로 초기화
    );
  }
}
