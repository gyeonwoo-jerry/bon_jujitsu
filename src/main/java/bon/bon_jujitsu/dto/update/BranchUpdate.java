package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record BranchUpdate(
    Optional<Long> branchId,
    Optional<String> region,
    Optional<String> address,
    Optional<String> area
) {
}
