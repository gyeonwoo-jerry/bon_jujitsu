package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.News;
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

  public static NewsResponse fromEntity(News news, List<String> imagePaths) {
    // imagePaths를 ImageResponse 리스트로 변환
    List<ImageResponse> imageResponses = imagePaths.stream()
        .map(path -> ImageResponse.builder()
            .id(null) // 이미지 ID가 없는 경우 null로 설정
            .url(path)
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
