package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.request.CartRequest;
import bon.bon_jujitsu.dto.response.CartResponse;
import bon.bon_jujitsu.dto.update.UpdateQuantityUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
  public ApiResponse<Void> createCart(
      @AuthenticationUserId Long userId,
      @Valid @RequestBody CartRequest request
  ) {
    cartService.createCart(userId, request);
    return ApiResponse.success("카트 생성 완료", null);
  }

  @GetMapping
  public ApiResponse<CartResponse> getCart(
      @AuthenticationUserId Long userId
  ) {
    return ApiResponse.success("카트 조회 성공", cartService.getCart(userId));
  }

  @PatchMapping("/items/{cartItemId}")
  public ApiResponse<Void> updateCartItemQuantity(
      @AuthenticationUserId Long userId,
      @PathVariable Long cartItemId,
      @Valid @RequestBody UpdateQuantityUpdate update
  ) {
    cartService.updateCartItemQuantity(userId, cartItemId, update.quantity());
    return ApiResponse.success("카트 수정 성공", null);
  }

  @DeleteMapping("/items/{cartItemId}")
  public ApiResponse<Void> removeCartItem(
      @AuthenticationUserId Long userId,
      @PathVariable Long cartItemId
  ) {
    cartService.removeCartItem(userId, cartItemId);
    return ApiResponse.success("카트 삭제 성공", null);
  }

  @DeleteMapping
  public ApiResponse<Void> clearCart(
      @AuthenticationUserId Long userId
  ) {
    cartService.clearCart(userId);
    return ApiResponse.success("카트 비우기 성공", null);
  }
}
