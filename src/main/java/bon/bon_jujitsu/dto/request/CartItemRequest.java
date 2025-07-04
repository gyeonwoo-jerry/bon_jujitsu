package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record CartItemRequest(
    @NotNull(message = "수량을 입력해주세요")
    @Min(value = 1, message = "수량은 최소 1 이상이어야 합니다")
    int quantity,
    @NotNull(message = "상품 옵션 ID를 입력해주세요")
    Long itemOptionId
) {

}
