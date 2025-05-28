package bon.bon_jujitsu.dto.update;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.List;

@Builder
public record UserBranchUpdate(
        @NotNull(message = "사용자 ID는 필수입니다")
        Long targetUserId,

        List<Long> branchesToAdd,

        List<Long> branchesToRemove
) {
}