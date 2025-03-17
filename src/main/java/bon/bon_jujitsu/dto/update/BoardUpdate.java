package bon.bon_jujitsu.dto.update;

import java.util.List;
import java.util.Optional;

public record BoardUpdate(
    Optional<String> title,
    Optional<String> content
) {

}
