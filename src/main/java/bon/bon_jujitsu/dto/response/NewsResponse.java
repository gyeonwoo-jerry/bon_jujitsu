package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.News;
import bon.bon_jujitsu.domain.PostImage;
import java.util.stream.Collectors;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record NewsResponse(
    Long id,
    String title,
    String content,
    String name,
    List<ImageResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static NewsResponse fromEntity(News news, List<PostImage> postImages) {
    // PostImage 엔티티를 직접 사용하여 ImageResponse 리스트 생성
    List<ImageResponse> imageResponses = postImages.stream()
        .map(postImage -> ImageResponse.builder()
            .id(postImage.getId()) // 실제 이미지 ID 사용
            .url(postImage.getImagePath()) // 실제 이미지 경로 사용
            .build())
        .collect(Collectors.toList());

    return NewsResponse.builder()
        .id(news.getId())
        .title(news.getTitle())
        .content(news.getContent())
        .name(news.getUser().getName())
        .images(imageResponses)
        .viewCount(news.getViewCount())
        .createdAt(news.getCreatedAt())
        .modifiedAT(news.getModifiedAt())
        .build();
  }
}
