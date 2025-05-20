package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemImage;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Builder
public record ItemResponse(
    Long id,
    String name,
    List<ItemOptionResponse> options,
    String content,
    int price,
    int sale,
    List<ReviewResponse> reviews,
    List<ItemImageResponse> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
  public static ItemResponse fromEntity(Item item) {
    List<ItemOptionResponse> optionResponses = item.getItemOptions().stream()
        .map(ItemOptionResponse::fromEntity)
        .toList();

    return ItemResponse.builder()
        .id(item.getId())
        .name(item.getName())
        .options(optionResponses)
        .content(item.getContent())
        .price(item.getPrice())
        .sale(item.getSale())
        .reviews(Optional.ofNullable(item.getReviews())
            .orElse(Collections.emptyList())
            .stream()
            .map(review -> new ReviewResponse(review, new ArrayList<>()))
            .collect(Collectors.toList()))
        .images(item.getImages().stream()
            .map(img -> new ItemImageResponse(img.getId(), img.getImagePath()))
            .toList())
        .createdAt(item.getCreatedAt())
        .modifiedAt(item.getModifiedAt())
        .build();
  }
}

