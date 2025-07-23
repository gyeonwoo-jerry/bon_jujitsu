package bon.bon_jujitsu.dto.update;

import bon.bon_jujitsu.domain.SkillPosition;
import bon.bon_jujitsu.domain.SkillType;
import java.util.Optional;

public record SkillUpdate(
    Optional<String> title,
    Optional<String> content,
    Optional<SkillPosition> position,
    Optional<SkillType> skillType
) {

}
