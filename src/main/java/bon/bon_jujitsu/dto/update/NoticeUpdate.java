package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record NoticeUpdate(
    Optional<String> title,
    Optional<String> content
) {

}
