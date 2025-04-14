package bon.bon_jujitsu.dto;

import bon.bon_jujitsu.domain.UserRole;

public record BranchRoleDto(
    Long branchId,
    String region,
    UserRole role
) {}