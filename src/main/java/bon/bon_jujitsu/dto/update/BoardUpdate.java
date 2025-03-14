package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record BoardUpdate(
    Optional<String> title,
    Optional<String> content
) {

}
