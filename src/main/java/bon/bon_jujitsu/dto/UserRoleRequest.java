package bon.bon_jujitsu.dto;

import bon.bon_jujitsu.domain.UserRole;

public record UserRoleRequest(
    Long targetUserId,
    UserRole role
) {

}
