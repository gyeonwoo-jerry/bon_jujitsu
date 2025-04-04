package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.News;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record NewsResponse(
    Long id,
    String title,
    String content,
    String name,
    List<String> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static NewsResponse fromEntity(News news, List<String> imagePaths) {
    return NewsResponse.builder()
        .id(news.getId())
        .title(news.getTitle())
        .content(news.getContent())
        .name(news.getUser().getName())
        .images(imagePaths)
        .viewCount(news.getViewCount())
        .createdAt(news.getCreatedAt())
        .modifiedAT(news.getModifiedAt())
        .build();
  }
}
