package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemOption;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.request.CartItemRequest;
import bon.bon_jujitsu.dto.request.CartRequest;
import bon.bon_jujitsu.dto.response.CartResponse;
import bon.bon_jujitsu.repository.CartItemRepository;
import bon.bon_jujitsu.repository.CartRepository;
import bon.bon_jujitsu.repository.ItemOptionRepository;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CartService {

  private final CartRepository cartRepository;
  private final UserRepository userRepository;
  private final ItemRepository itemRepository;
  private final CartItemRepository cartItemRepository;
  private final ItemOptionRepository itemOptionRepository;

  /**
   * 장바구니에 상품 추가
   */
  @CacheEvict(value = "userCart", key = "#userId")
  public void createCart(Long userId, CartRequest request) {
    User user = findAndValidateUser(userId);
    Item item = findItemById(request.itemId());

    // 사용자의 장바구니 조회 또는 생성
    Cart cart = findOrCreateCart(user);

    // 각 옵션별로 장바구니에 추가
    for (CartItemRequest cartItemRequest : request.cartItems()) {
      ItemOption itemOption = findItemOptionById(cartItemRequest.itemOptionId());

      // 재고 확인
      if (itemOption.getAmount() < cartItemRequest.quantity()) {
        throw new IllegalArgumentException(
            String.format("재고가 부족합니다. 상품: %s, 옵션: %s/%s, 요청수량: %d, 재고: %d",
                item.getName(),
                itemOption.getSize(),
                itemOption.getColor(),
                cartItemRequest.quantity(),
                itemOption.getAmount())
        );
      }

      // 장바구니에 상품 추가 (이미 있으면 수량 업데이트)
      cart.addItem(item, itemOption, cartItemRequest.quantity());

      log.info("장바구니 상품 추가: userId={}, itemId={}, optionId={}, quantity={}",
          userId, request.itemId(), cartItemRequest.itemOptionId(), cartItemRequest.quantity());
    }

    cartRepository.save(cart);

    int totalQuantity = request.cartItems().stream()
        .mapToInt(CartItemRequest::quantity)
        .sum();

    log.info("장바구니 일괄 추가 완료: userId={}, itemId={}, totalQuantity={}",
        userId, request.itemId(), totalQuantity);
  }

  /**
   * 장바구니 조회
   */
  @Transactional(readOnly = true)
  @Cacheable(value = "userCart", key = "#userId")
  public CartResponse getCart(Long userId) {
    User user = findAndValidateUser(userId);

    // 장바구니가 없으면 빈 장바구니 반환
    Cart cart = cartRepository.findByUserWithItems(user)
        .orElseGet(() -> Cart.builder().user(user).build());

    return new CartResponse(cart);
  }

  /**
   * 장바구니 아이템 수량 변경
   */
  @CacheEvict(value = "userCart", key = "#userId")
  public void updateCartItemQuantity(Long userId, Long cartItemId, int quantity) {
    User user = findAndValidateUser(userId);
    Cart cart = findUserCart(user);
    CartItem cartItem = findCartItemById(cartItemId);

    // 권한 검증: 해당 아이템이 사용자의 장바구니에 속하는지 확인
    validateCartItemOwnership(cart, cartItem);

    // 수량 업데이트
    if (quantity <= 0) {
      cart.removeItem(cartItem.getItem().getId());
      log.info("수량이 0 이하로 설정되어 아이템 삭제: userId={}, cartItemId={}", userId, cartItemId);
    } else {
      cartItem.updateQuantity(quantity);
      log.info("장바구니 아이템 수량 변경: userId={}, cartItemId={}, quantity={}", userId, cartItemId, quantity);
    }

    cartRepository.save(cart);
  }

  /**
   * 장바구니 아이템 삭제
   */
  @CacheEvict(value = "userCart", key = "#userId")
  public void removeCartItem(Long userId, Long cartItemId) {
    findAndValidateUser(userId);
    CartItem cartItem = findCartItemById(cartItemId);

    // 권한 검증: 해당 CartItem이 사용자의 것인지 확인
    if (!cartItem.getCart().getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("해당 장바구니 아이템에 접근 권한이 없습니다.");
    }

    // 직접 삭제
    cartItemRepository.deleteById(cartItemId);

    log.info("장바구니 아이템 삭제 완료: userId={}, cartItemId={}", userId, cartItemId);
  }

  /**
   * 장바구니 전체 비우기
   */
  @CacheEvict(value = "userCart", key = "#userId")
  public void clearCart(Long userId) {
    User user = findAndValidateUser(userId);
    Cart cart = findUserCart(user);

    cart.clear();
    cartRepository.save(cart);

    log.info("장바구니 전체 비우기 완료: userId={}", userId);
  }

  // === Private Helper Methods ===

  private User findUserById(Long userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
  }

  private User findAndValidateUser(Long userId) {
    User user = findUserById(userId);
    validateUserPermission(user);
    return user;
  }

  private void validateUserPermission(User user) {
    boolean isApprovedUser = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() != UserRole.PENDING);

    if (!isApprovedUser) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 장바구니를 이용할 수 없습니다.");
    }
  }

  private Item findItemById(Long itemId) {
    return itemRepository.findById(itemId)
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
  }

  private ItemOption findItemOptionById(Long itemOptionId) {
    return itemOptionRepository.findById(itemOptionId)
        .orElseThrow(() -> new IllegalArgumentException("상품 옵션을 찾을 수 없습니다."));
  }

  private CartItem findCartItemById(Long cartItemId) {
    return cartItemRepository.findById(cartItemId)
        .orElseThrow(() -> new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다."));
  }

  private Cart findOrCreateCart(User user) {
    return cartRepository.findByUser(user)
        .orElseGet(() -> {
          Cart newCart = Cart.builder().user(user).build();
          return cartRepository.save(newCart);
        });
  }

  private Cart findUserCart(User user) {
    return cartRepository.findByUser(user)
        .orElseThrow(() -> new IllegalArgumentException("장바구니가 존재하지 않습니다."));
  }

  private void validateCartItemOwnership(Cart cart, CartItem cartItem) {
    if (!cartItem.getCart().getId().equals(cart.getId())) {
      throw new IllegalArgumentException("해당 장바구니 아이템에 접근 권한이 없습니다.");
    }
  }
}