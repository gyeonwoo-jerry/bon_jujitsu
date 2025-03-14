package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotNull;

public record CartRequest(
    @NotNull(message = "수량을 입력해주세요")
    int quantity,
    @NotNull(message = "상품 ID를 입력해주세요")
    Long itemId
) {
}
