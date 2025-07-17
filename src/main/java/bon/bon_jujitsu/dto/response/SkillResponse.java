package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.PostMedia;
import bon.bon_jujitsu.domain.Skill;
import java.util.stream.Collectors;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Builder
public record SkillResponse(
    Long id,
    String title,
    String content,
    String author,
    Long authorId,
    List<MediaResponse> media,
    Long viewCount,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static SkillResponse fromEntity(Skill skill, List<PostMedia> postMedia) {
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
      if (skill.getUser() != null) {
        authorName = skill.getUser().getName();
      } else {
        authorName = "탈퇴한 회원";
      }
    } catch (Exception e) {
      authorName = "탈퇴한 회원";
    }

    Long authorId = null;
    try {
      if (skill.getUser() != null) {
        authorId = skill.getUser().getId();
      }
    } catch (Exception e) {
      authorId = null;
    }


    return SkillResponse.builder()
        .id(skill.getId())
        .title(skill.getTitle())
        .content(skill.getContent())
        .author(authorName)
        .authorId(authorId)
        .media(mediaRespons)
        .viewCount(skill.getViewCount())
        .createdAt(skill.getCreatedAt())
        .modifiedAT(skill.getModifiedAt())
        .build();
  }
}
