package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Review;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.util.StringUtils;

public class ReviewResponseDTO {
  private final Long id;
  private final String content;
  private final double star;
  private final int depth;
  private final Long parentId;
  private final String name;
  private final Long itemId;
  private final Long orderId;
  private final List<String> images;
  private final LocalDateTime createdAt;
  private final LocalDateTime modifiedAt;
  private List<ReviewResponseDTO> childReviews;

  // 생성자
  public ReviewResponseDTO(Review review) {
    this.id = review.getId();
    this.content = review.getContent() != null ? review.getContent() : "";
    this.star = review.getStar();
    this.depth = review.getDepth();
    this.parentId = Optional.ofNullable(review.getParentReview())
        .map(Review::getId).orElse(null);
    this.name = review.getUser() != null ? review.getUser().getName() : "";
    this.itemId = review.getItem() != null ? review.getItem().getId() : null;
    this.orderId = review.getOrder() != null ? review.getOrder().getId() : null;
    this.images = review.getImages() != null ?
        review.getImages().stream()
            .filter(Objects::nonNull)
            .map(img -> img != null ? img.getImagePath() : "")
            .filter(StringUtils::hasText)
            .collect(Collectors.toList()) :
        new ArrayList<>();
    this.createdAt = review.getCreatedAt();
    this.modifiedAt = review.getModifiedAt();
    this.childReviews = new ArrayList<>();
  }

  // 게터 메서드들

  public void addChildReview(ReviewResponseDTO child) {
    if (childReviews == null) {
      childReviews = new ArrayList<>();
    }
    childReviews.add(child);
  }

  // 기타 필요한 메서드들
}