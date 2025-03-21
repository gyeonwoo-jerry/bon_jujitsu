package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Skill;
import bon.bon_jujitsu.domain.SkillImage;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record SkillResponse(
    Long id,
    String title,
    String content,
    String region,
    String name,
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static SkillResponse fromEntity(Skill skill) {
    return SkillResponse.builder()
        .id(skill.getId())
        .title(skill.getTitle())
        .content(skill.getContent())
        .region(skill.getBranch().getRegion())
        .name(skill.getUser().getName())
        .images(skill.getImages().stream().map(SkillImage::getImagePath).toList())
        .createdAt(skill.getCreatedAt())
        .modifiedAT(skill.getModifiedAt())
        .build();
  }
}
