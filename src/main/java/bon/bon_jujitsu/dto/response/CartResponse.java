package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.dto.CartItemDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public record CartResponse(
    Long id,
    List<CartItemDto> items,
    int totalPrice,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {
  public CartResponse (Cart cart) {
    this(
        cart.getId(),
        cart.getCartItems().stream()
            .map(CartItemDto::new)
            .collect(Collectors.toList()),
        calculateTotalPrice(cart.getCartItems()),
        cart.getCreatedAt(),
        cart.getModifiedAt()
    );
  }

  private static int calculateTotalPrice(List<CartItem> items) {
    return items.stream()
        .mapToInt(item -> item.getItem().getPrice() * item.getQuantity())
        .sum();
  }
}



