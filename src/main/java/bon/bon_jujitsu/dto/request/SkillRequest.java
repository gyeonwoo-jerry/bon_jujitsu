package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.SkillPosition;
import bon.bon_jujitsu.domain.SkillType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SkillRequest(
    @NotBlank(message = "제목을 입력해주세요")
    String title,
    String content,
    @NotNull(message = "포지션을 선택해주세요.")
    SkillPosition position,
    @NotNull(message = "기술 타입을 선택해주세요.")
    SkillType skillType
) {
}
