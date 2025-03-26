package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.UserRole;

public record LoginResponse(
        boolean success,
        String message,
        String token,
        UserRole userRole,
        String name

) {
}
