package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Item;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.Builder;

@Builder
public record ItemResponse(
    Long id,
    String name,
    String size,
    String content,
    int price,
    int sale,
    int amount,
    List<ReviewResponse> reviews,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {

  public static ItemResponse fromEntity(Item item) {
    return ItemResponse.builder()
        .id(item.getId())
        .name(item.getName())
        .size(item.getSize())
        .content(item.getContent())
        .price(item.getPrice())
        .sale(item.getSale())
        .amount(item.getAmount())
        .reviews(Optional.ofNullable(item.getReviews())  // Null 방지
            .orElse(Collections.emptyList())
            .stream()
            .map(review -> new ReviewResponse(review, new ArrayList<>())) // childReviews 추가
            .collect(Collectors.toList()))
        .createdAt(item.getCreatedAt())
        .modifiedAt(item.getModifiedAt())
        .build();
  }

}
