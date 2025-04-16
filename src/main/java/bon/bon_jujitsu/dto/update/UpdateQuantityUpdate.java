package bon.bon_jujitsu.dto.update;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdateQuantityUpdate(
    @NotNull(message = "수량을 입력해주세요")
    @Min(value = 1, message = "수량은 1개 이상이어야 합니다")
    int quantity
) {
}
