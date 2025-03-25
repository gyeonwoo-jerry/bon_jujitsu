package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.CartRequest;
import bon.bon_jujitsu.dto.response.CartResponse;
import bon.bon_jujitsu.dto.update.UpdateQuantityRequest;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/carts")
@RequiredArgsConstructor
public class CartController {

  private final CartService cartService;

  @PostMapping
  public ResponseEntity<Status> createCart(
      @AuthenticationUserId Long userId,
      @Valid @RequestBody CartRequest request
  ) {
    cartService.createCart(userId, request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "카트생성 완료"));
  }

  @GetMapping
  public ResponseEntity<CartResponse> getCart(
      @AuthenticationUserId Long userId
  ) {
    CartResponse cartResponse = cartService.getCart(userId);
    return ResponseEntity.ok(cartResponse);
  }

  @PatchMapping("/items/{cartItemId}")
  public ResponseEntity<Status> updateCartItemQuantity(
      @AuthenticationUserId Long userId,
      @PathVariable Long cartItemId,
      @Valid @RequestBody UpdateQuantityRequest request
  ) {
    cartService.updateCartItemQuantity(userId, cartItemId, request.quantity());
    return ResponseEntity.ok(
        Status.createStatusDto(HttpStatus.OK, "상품 수량이 변경되었습니다.")
    );
  }

  @DeleteMapping("/items/{itemId}")
  public ResponseEntity<Status> removeCartItem(
      @AuthenticationUserId Long userId,
      @PathVariable Long itemId
  ) {
    cartService.removeCartItem(userId, itemId);
    return ResponseEntity.ok(
        Status.createStatusDto(HttpStatus.OK, "장바구니에서 상품이 삭제되었습니다.")
    );
  }

  @DeleteMapping
  public ResponseEntity<Status> clearCart(
      @AuthenticationUserId Long userId
  ) {
    cartService.clearCart(userId);
    return ResponseEntity.ok(
        Status.createStatusDto(HttpStatus.OK, "장바구니가 비워졌습니다.")
    );
  }
}
