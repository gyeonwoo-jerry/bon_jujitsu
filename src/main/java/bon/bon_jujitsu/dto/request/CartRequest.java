package bon.bon_jujitsu.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CartRequest(
    @NotNull(message = "상품 ID를 입력해주세요")
    Long itemId,
    List<CartItemRequest> cartItems
) {
}
