package bon.bon_jujitsu.dto.response;

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
    List<ImageResponse> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {
  public static SponsorResponse fromEntity(Sponsor sponsor, List<String> imagePaths) {
    // imagePaths를 ImageResponse 리스트로 변환
    List<ImageResponse> imageResponses = imagePaths.stream()
        .map(path -> ImageResponse.builder()
            .id(null) // 이미지 ID가 없는 경우 null로 설정
            .url(path)
            .build())
        .collect(Collectors.toList());

    return SponsorResponse.builder()
        .id(sponsor.getId())
        .title(sponsor.getTitle())
        .content(sponsor.getContent())
        .name(sponsor.getUser().getName())
        .images(imageResponses)
        .createdAt(sponsor.getCreatedAt())
        .modifiedAT(sponsor.getModifiedAt())
        .build();
  }
}
