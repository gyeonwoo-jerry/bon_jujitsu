package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.PostMedia;
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
    List<MediaResponse> media,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {
  public static SponsorResponse fromEntity(Sponsor sponsor, List<PostMedia> postMedia) {
    // PostMedia 엔티티를 직접 사용하여 MediaResponse 리스트 생성
    List<MediaResponse> mediaRespons = postMedia.stream()
        .map(postImage -> MediaResponse.builder()
            .id(postImage.getId())
            .url(postImage.getFilePath())
            .originalFileName(postImage.getOriginalFileName())
            .mediaType(postImage.getMediaType().name())
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
        .media(mediaRespons)
        .viewCount(sponsor.getViewCount())
        .createdAt(sponsor.getCreatedAt())
        .modifiedAT(sponsor.getModifiedAt())
        .build();
  }
}
