package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Branch;
import java.time.LocalDateTime;

public record BranchResponse (
    Long id,
    String region,
    String address,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT

) {

  public static BranchResponse from (Branch branch) {
    return new BranchResponse(
        branch.getId(),
        branch.getRegion(),
        branch.getAddress(),
        branch.getCreatedAt(),
        branch.getModifiedAt());
  }


}
