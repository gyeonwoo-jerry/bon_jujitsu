package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.domain.OrderStatus;
import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.OrderRequest;
import bon.bon_jujitsu.dto.response.OrderResponse;
import bon.bon_jujitsu.dto.update.OrderUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.OrderService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {

  private final OrderService orderService;

  @PostMapping("/orders")
  public ApiResponse<Void> createOrder(
      @AuthenticationUserId Long userId,
      @Valid @RequestBody OrderRequest request
  ) {
    orderService.createOrder(userId, request);
    return ApiResponse.success("주문 완료", null);
  }

  @GetMapping("/orders/admin")
  public ApiResponse<PageResponse<OrderResponse>> getOrdersByStatus (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @RequestParam(name = "status", required = false) OrderStatus status,
      @AuthenticationUserId Long id
  ) {
    return ApiResponse.success("주문 조회 완료", orderService.getOrdersByStatus(page, size, id, status));
  }

  @GetMapping("/orders/myself")
  public ApiResponse<PageResponse<OrderResponse>> getMyOrders (
      @AuthenticationUserId Long id,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @RequestParam(required = false) List<OrderStatus> status
  ) {
    return ApiResponse.success("내 주문 조회 완료", orderService.getMyOrders(page, size, id, status));
  }

  @PatchMapping("/orders/admin")
  public ApiResponse<Void> updateOrderByAdmin (
      @Valid @RequestBody OrderUpdate request,
      @AuthenticationUserId Long userId
  ) {
    orderService.updateOrderByAdmin(request, userId);
    return ApiResponse.success("주문 상태 변경 완료", null);
  }

  @PatchMapping("/orders/cancel/{orderId}")
  public ApiResponse<Void> cancelOrder (
      @PathVariable("orderId") Long orderId,
      @AuthenticationUserId Long userId
  ) {
    orderService.cancelOrder(orderId, userId);
    return ApiResponse.success("주문 취소 완료", null);
  }

  @PatchMapping("/orders/return/{orderId}")
  public ApiResponse<Void> returnOrder (
      @PathVariable("orderId") Long orderId,
      @AuthenticationUserId Long userId
  ) {
    orderService.returnOrder(orderId, userId);
    return ApiResponse.success("주문 환불 신청 완료", null);
  }
}
