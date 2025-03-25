package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.News;
import bon.bon_jujitsu.domain.NewsImage;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record NewsResponse(
    Long id,
    String title,
    String content,
    String name,
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static NewsResponse fromEntity(News news) {
    return NewsResponse.builder()
        .id(news.getId())
        .title(news.getTitle())
        .content(news.getContent())
        .name(news.getUser().getName())
        .images(news.getImages().stream().map(NewsImage::getImagePath).toList())
        .createdAt(news.getCreatedAt())
        .modifiedAT(news.getModifiedAt())
        .build();
  }
}
