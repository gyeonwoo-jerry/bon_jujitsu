package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Skill;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record SkillResponse(
    Long id,
    String title,
    String content,
    String name,
    List<String> images,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static SkillResponse fromEntity(Skill skill, List<String> imagePaths) {
    return SkillResponse.builder()
        .id(skill.getId())
        .title(skill.getTitle())
        .content(skill.getContent())
        .name(skill.getUser().getName())
        .images(imagePaths)
        .viewCount(skill.getViewCount())
        .createdAt(skill.getCreatedAt())
        .modifiedAT(skill.getModifiedAt())
        .build();
  }
}
