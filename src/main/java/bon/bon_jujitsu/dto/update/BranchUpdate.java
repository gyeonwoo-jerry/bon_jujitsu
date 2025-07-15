package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record BranchUpdate(
    Optional<String> region,
    Optional<String> address,
    Optional<String> area,
    Optional<String> content
) {
}
