package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record ItemUpdate(
        Optional<String> name,
        Optional<String> size,
        Optional<String> content,
        Optional<Integer> price,
        Optional<Integer> sale,
        Optional<Integer> amount
) {
}
