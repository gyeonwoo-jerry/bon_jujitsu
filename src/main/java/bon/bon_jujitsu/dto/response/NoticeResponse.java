package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Notice;
import bon.bon_jujitsu.domain.PostImage;
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

  public static NoticeResponse fromEntity(Notice notice, List<PostImage> postImages) {
    // PostImage 엔티티를 직접 사용하여 ImageResponse 리스트 생성
    List<ImageResponse> imageResponses = postImages.stream()
        .map(postImage -> ImageResponse.builder()
            .id(postImage.getId()) // 실제 이미지 ID 사용
            .url(postImage.getImagePath()) // 실제 이미지 경로 사용
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
