package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.PayType;
import bon.bon_jujitsu.dto.CartItemDto;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
    Long id,
    String name,
    String address,
    String zipcode,
    String addrDetail,
    String phoneNum,
    String requirement,
    double totalPrice,
    int totalCount,
    PayType payType,
    OrderStatus orderStatus,
    Long userId,
    List<CartItemDto> cartItems,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {
}
