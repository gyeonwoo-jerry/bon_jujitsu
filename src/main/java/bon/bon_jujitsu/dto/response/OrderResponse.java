package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Order;
import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.domain.PayType;
import bon.bon_jujitsu.dto.OrderItemDto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import lombok.Builder;

@Builder
public record OrderResponse(
    Long id,
    String name,
    String address,
    String zipcode,
    String addrDetail,
    String phoneNum,
    String requirement,
    Long totalPrice,
    int totalCount,
    PayType payType,
    OrderStatus orderStatus,
    Long userId,
    List<OrderItemDto> orderItems,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt
) {
  public static OrderResponse fromEntity(Order order) {
    return OrderResponse.builder()
        .id(order.getId())
        .name(order.getName())
        .address(order.getAddress())
        .zipcode(order.getZipcode())
        .addrDetail(order.getAddrDetail())
        .phoneNum(order.getPhoneNum())
        .requirement(order.getRequirement())
        .totalPrice(order.getTotalPrice())
        .totalCount(order.getTotalCount())
        .payType(order.getPayType())
        .orderStatus(order.getOrderStatus())
        .userId(order.getUser().getId())
        .orderItems(order.getOrderItems().stream()
            .map(OrderItemDto::new)
            .collect(Collectors.toList()))
        .createdAt(order.getCreatedAt())
        .modifiedAt(order.getModifiedAt())
        .build();
  }
}