package bon.bon_jujitsu.dto.update;

import java.util.List;
import java.util.Optional;

public record ItemUpdate(
    Optional<String> name,
    Optional<List<ItemOptionUpdate>> option,
    Optional<String> content,
    Optional<Integer> price,
    Optional<Integer> sale,
    Optional<Integer> amount
) {
}
