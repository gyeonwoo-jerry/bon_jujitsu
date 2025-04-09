package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.UserRole;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    UserRole userRole,
    String name
) {
}
