package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.PostImage;
import bon.bon_jujitsu.domain.Sponsor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Builder;

@Builder
public record SponsorResponse(
    Long id,
    String title,
    String content,
    String name,
    String url,
    List<ImageResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {
  public static SponsorResponse fromEntity(Sponsor sponsor, List<PostImage> postImages) {
    // PostImage 엔티티를 직접 사용하여 ImageResponse 리스트 생성
    List<ImageResponse> imageResponses = postImages.stream()
        .map(postImage -> ImageResponse.builder()
            .id(postImage.getId()) // 실제 이미지 ID 사용
            .url(postImage.getImagePath()) // 실제 이미지 경로 사용
            .build())
        .collect(Collectors.toList());

    return SponsorResponse.builder()
        .id(sponsor.getId())
        .title(sponsor.getTitle())
        .content(sponsor.getContent())
        .name(sponsor.getUser().getName())
        .url(sponsor.getUrl())
        .images(imageResponses)
        .viewCount(sponsor.getViewCount())
        .createdAt(sponsor.getCreatedAt())
        .modifiedAT(sponsor.getModifiedAt())
        .build();
  }
}
