package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Notice;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record NoticeResponse(
    Long id,
    String title,
    String content,
    String region,
    String name,
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
        .createdAt(notice.getCreatedAt())
        .modifiedAT(notice.getModifiedAt())
        .build();
  }

}
