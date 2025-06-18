package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.Stripe;
import bon.bon_jujitsu.domain.UserRole;

import java.util.List;

public record GetAllUserRequest(
    String name,
    UserRole role,
    List<Long> branchIds,
    Stripe stripe
) {
}
