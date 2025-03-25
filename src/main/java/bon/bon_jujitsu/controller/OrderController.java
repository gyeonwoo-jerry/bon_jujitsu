package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.OrderRequest;
import bon.bon_jujitsu.dto.response.OrderResponse;
import bon.bon_jujitsu.dto.update.OrderUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
  public ResponseEntity<Status> createOrder(
      @AuthenticationUserId Long userId,
      @Valid @RequestBody OrderRequest request
  ) {
    orderService.createOrder(userId, request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "주문성공"));
  }

  @GetMapping("/orders")
  public ResponseEntity<PageResponse<OrderResponse>> getMyOrders (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @AuthenticationUserId Long id
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(orderService.getMyOrders(page, size, id));
  }

  @GetMapping("/orders/admin")
  public ResponseEntity<PageResponse<OrderResponse>> getWaitingOrders (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @AuthenticationUserId Long id
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(orderService.getWaitingOrders(page, size, id));
  }

  @PatchMapping("/orders/admin")
  public ResponseEntity<Status> updateOrderByAdmin (
      @Valid @RequestBody OrderUpdate request,
      @AuthenticationUserId Long userId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(orderService.updateOrderByAdmin(request, userId));
  }

  @PatchMapping("/orders/cancel/{orderId}")
  public ResponseEntity<Status> cancelOrder (
      @PathVariable("orderId") Long orderId,
      @AuthenticationUserId Long userId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(orderService.cancelOrder(orderId, userId));
  }

  @PatchMapping("/orders/return/{orderId}")
  public ResponseEntity<Status> returnOrder (
      @PathVariable("orderId") Long orderId,
      @AuthenticationUserId Long userId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(orderService.returnOrder(orderId, userId));
  }
}
