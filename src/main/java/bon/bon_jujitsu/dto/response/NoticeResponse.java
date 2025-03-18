package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.BoardImage;
import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.NoticeImage;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record NoticeResponse(
    Long id,
    String title,
    String content,
    String region,
    String name,
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static NoticeResponse fromEntity(Notice notice) {
    return NoticeResponse.builder()
        .id(notice.getId())
        .title(notice.getTitle())
        .content(notice.getContent())
        .region(notice.getBranch().getRegion())
        .name(notice.getUser().getName())
        .images(notice.getImages().stream().map(NoticeImage::getImagePath).toList())
        .createdAt(notice.getCreatedAt())
        .modifiedAT(notice.getModifiedAt())
        .build();
  }

}
