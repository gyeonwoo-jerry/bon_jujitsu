package bon.bon_jujitsu.dto.response;

import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record ReviewableOrderResponse(
    Long orderId,
    Long itemId,
    String itemName,
    LocalDateTime orderDate,
    int quantity,
    int price
) {
}
