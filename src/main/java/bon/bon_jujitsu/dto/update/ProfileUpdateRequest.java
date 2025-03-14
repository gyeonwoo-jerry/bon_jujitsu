package bon.bon_jujitsu.dto.update;

import bon.bon_jujitsu.domain.Stripe;
import jakarta.validation.constraints.Min;
import java.util.Optional;

public record ProfileUpdateRequest(
    Optional<String> name,
    Optional<String> nickname,
    Optional<String> password,
    Optional<String> email,
    Optional<String> phoneNum,
    Optional<String> address,
    Optional<String> birthday,
    Optional<String> gender,
    Optional<Long> branchId,
    Optional<@Min(1) Integer> level,
    Optional<Stripe> stripe
) {}
