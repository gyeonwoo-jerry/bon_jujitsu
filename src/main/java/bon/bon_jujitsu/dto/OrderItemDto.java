package bon.bon_jujitsu.dto;

import bon.bon_jujitsu.domain.OrderItem;

public record OrderItemDto(
    Long id,
    Long itemId,
    String itemName,
    int price,          // 장바구니에 담긴 가격
    int currentPrice,   // 현재 상품 가격 (변동 가능)
    int quantity,
    int totalPrice,
    boolean isPriceChanged  // 가격 변동 여부
) {
  public OrderItemDto(OrderItem orderItem) {
    this(
        orderItem.getId(),
        orderItem.getItem().getId(),
        orderItem.getItem().getName(),
        orderItem.getPrice(),
        orderItem.getItem().getPrice(),
        orderItem.getQuantity(),
        orderItem.getPrice() * orderItem.getQuantity(),
        orderItem.getPrice() != orderItem.getItem().getPrice()
    );
  }
}