package bon.bon_jujitsu.dto.update;

import bon.bon_jujitsu.domain.Stripe;
import jakarta.validation.constraints.Min;
import java.util.Optional;

public record ProfileUpdateRequest(
    Optional<String> name,
    Optional<String> memberId,
    Optional<String> password,
    Optional<String> email,
    Optional<String> phoneNum,
    Optional<String> address,
    Optional<String> birthday,
    Optional<String> gender,
    Optional<Long> branchId,
    Optional<@Min(1) Integer> level,
    Optional<Stripe> stripe,
    Optional<String> sns1,
    Optional<String> sns2,
    Optional<String> sns3,
    Optional<String> sns4,
    Optional<String> sns5
) {}
