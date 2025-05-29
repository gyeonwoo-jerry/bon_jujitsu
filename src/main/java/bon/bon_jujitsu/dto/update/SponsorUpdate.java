package bon.bon_jujitsu.dto.update;

import java.util.Optional;

public record SponsorUpdate(
    Optional<String> title,
    Optional<String> content,
    Optional<String> url
) {

}
