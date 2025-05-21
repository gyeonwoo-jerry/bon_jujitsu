package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Notice;
import java.util.stream.Collectors;
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
    List<ImageResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static NoticeResponse fromEntity(Notice notice, List<String> imagePaths) {
    // imagePaths를 ImageResponse 리스트로 변환
    List<ImageResponse> imageResponses = imagePaths.stream()
        .map(path -> ImageResponse.builder()
            .id(null) // 이미지 ID가 없는 경우 null로 설정
            .url(path)
            .build())
        .collect(Collectors.toList());

    return NoticeResponse.builder()
        .id(notice.getId())
        .title(notice.getTitle())
        .content(notice.getContent())
        .region(notice.getBranch().getRegion())
        .name(notice.getUser().getName())
        .images(imageResponses)
        .viewCount(notice.getViewCount())
        .createdAt(notice.getCreatedAt())
        .modifiedAT(notice.getModifiedAt())
        .build();
  }

}
