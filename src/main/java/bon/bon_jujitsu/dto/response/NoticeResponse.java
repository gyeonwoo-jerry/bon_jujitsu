package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Notice;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record NoticeResponse(
    Long id,
    String title,
    String content,
    String region,
    String name,
    List<String> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static NoticeResponse fromEntity(Notice notice, List<String> imagePaths) {
    return NoticeResponse.builder()
        .id(notice.getId())
        .title(notice.getTitle())
        .content(notice.getContent())
        .region(notice.getBranch().getRegion())
        .name(notice.getUser().getName())
        .images(imagePaths)
        .viewCount(notice.getViewCount())
        .createdAt(notice.getCreatedAt())
        .modifiedAT(notice.getModifiedAt())
        .build();
  }

}
