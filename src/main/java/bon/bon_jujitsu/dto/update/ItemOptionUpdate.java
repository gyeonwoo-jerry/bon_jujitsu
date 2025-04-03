package bon.bon_jujitsu.dto.update;

import jakarta.validation.constraints.Min;
import java.util.Optional;

public record ItemOptionUpdate(
    Optional<String> color,
    Optional<String> size,
    @Min(value = 1, message = "수량은 최소 1 이상이어야 합니다")
    Optional<Integer> amount
) {
}