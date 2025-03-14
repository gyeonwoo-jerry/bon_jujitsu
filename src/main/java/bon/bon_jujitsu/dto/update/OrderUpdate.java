package bon.bon_jujitsu.dto.update;

import bon.bon_jujitsu.domain.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record OrderUpdate(
    Long orderId,
    @NotNull
    OrderStatus status
) {

}
