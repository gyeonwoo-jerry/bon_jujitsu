package bon.bon_jujitsu.dto.request;

import bon.bon_jujitsu.domain.UserRole;

public record GetAllUserRequest(
    String name,
    UserRole role,
    Long branchId
) {

}
