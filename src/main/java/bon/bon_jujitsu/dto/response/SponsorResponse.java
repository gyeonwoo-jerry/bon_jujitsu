package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Sponsor;
import bon.bon_jujitsu.domain.SponsorImage;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record SponsorResponse(
    Long id,
    String title,
    String content,
    String name,
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {
  public static SponsorResponse fromEntity(Sponsor sponsor, List<String> imagePaths) {
    return SponsorResponse.builder()
        .id(sponsor.getId())
        .title(sponsor.getTitle())
        .content(sponsor.getContent())
        .name(sponsor.getUser().getName())
        .images(imagePaths)
        .createdAt(sponsor.getCreatedAt())
        .modifiedAT(sponsor.getModifiedAt())
        .build();
  }
}
