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
    String author,
    Long authorId,
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

    String authorName;
    try {
      if (sponsor.getUser() != null) {
        authorName = sponsor.getUser().getName();
      } else {
        authorName = "탈퇴한 회원";
      }
    } catch (Exception e) {
      authorName = "탈퇴한 회원";
    }

    Long authorId = null;
    try {
      if (sponsor.getUser() != null) {
        authorId = sponsor.getUser().getId();
      }
    } catch (Exception e) {
      authorId = null;
    }

    return SponsorResponse.builder()
        .id(sponsor.getId())
        .title(sponsor.getTitle())
        .content(sponsor.getContent())
        .author(authorName)
        .authorId(authorId)
        .url(sponsor.getUrl())
        .images(imageResponses)
        .viewCount(sponsor.getViewCount())
        .createdAt(sponsor.getCreatedAt())
        .modifiedAT(sponsor.getModifiedAt())
        .build();
  }
}
