package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record SkillUpdate(
    Optional<String> title,
    Optional<String> content
) {

}
