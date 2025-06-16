package bon.bon_jujitsu.dto;

import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.dto.response.ItemOptionResponse;

public record CartItemDto(
    Long id,
    Long itemId,
    String itemName,
    int price,          // 장바구니에 담긴 가격
    int currentPrice,   // 현재 상품 가격 (변동 가능)
    int quantity,
    int totalPrice,
    boolean isPriceChanged,
    ItemOptionResponse itemOption// 가격 변동 여부,
) {
  public CartItemDto(CartItem cartItem) {
    this(
        cartItem.getId(),
        cartItem.getItem().getId(),
        cartItem.getItem().getName(),
        cartItem.getPrice(),
        cartItem.getItem().getPrice(),
        cartItem.getQuantity(),
        cartItem.getPrice() * cartItem.getQuantity(),
        cartItem.getPrice() != cartItem.getItem().getPrice(),
        cartItem.getItemOption() != null ? ItemOptionResponse.fromEntity(cartItem.getItemOption()) : null
    );
  }
}
