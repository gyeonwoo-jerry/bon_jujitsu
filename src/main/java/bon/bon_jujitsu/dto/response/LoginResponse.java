package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.dto.BranchRoleDto;
import java.util.List;

public record LoginResponse(
    String accessToken,
    String refreshToken,
    String name,
    boolean isAdmin,
    List<BranchRoleDto> branchRoles
) {
}
