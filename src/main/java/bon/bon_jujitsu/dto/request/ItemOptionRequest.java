package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

@Builder
public record ItemOptionRequest(
    String color,
    String size,
    @NotNull(message = "수량을 입력해주세요")
    @Min(value = 1, message = "수량은 최소 1 이상이어야 합니다")
    int amount
) {
}
