package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Cart;
import bon.bon_jujitsu.domain.CartItem;
import bon.bon_jujitsu.domain.Item;
import bon.bon_jujitsu.domain.ItemOption;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.request.CartRequest;
import bon.bon_jujitsu.dto.response.CartResponse;
import bon.bon_jujitsu.repository.CartItemRepository;
import bon.bon_jujitsu.repository.CartRepository;
import bon.bon_jujitsu.repository.ItemOptionRepository;
import bon.bon_jujitsu.repository.ItemRepository;
import bon.bon_jujitsu.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CartService {

  private final CartRepository cartRepository;
  private final UserRepository userRepository;
  private final ItemRepository itemRepository;
  private final CartItemRepository cartItemRepository;
  private final ItemOptionRepository itemOptionRepository;

  public void createCart(Long userId, CartRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() == UserRole.PENDING) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 장바구니를 이용할 수 없습니다.");
    }

    Item item = itemRepository.findById(request.itemId())
        .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));

    ItemOption itemOption = itemOptionRepository.findById(request.itemOptionId())
        .orElseThrow(() -> new IllegalArgumentException("상품 옵션을 찾을 수 없습니다."));

    // 사용자의 장바구니 찾기, 없으면 새로 생성
    Cart cart = cartRepository.findByUser(user)
        .orElseGet(() -> cartRepository.save(Cart.builder().user(user).build()));

    // 장바구니에 상품 추가 (이미 있으면 수량 업데이트)
    cart.addItem(item, itemOption, request.quantity());

    cartRepository.save(cart);
  }

  public CartResponse getCart(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() == UserRole.PENDING) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 장바구니를 이용할 수 없습니다.");
    }

    Cart cart = cartRepository.findByUser(user)
        .orElseGet(() -> Cart.builder().user(user).build());

    return new CartResponse(cart);
  }

  public void updateCartItemQuantity(Long userId, Long cartItemId, int quantity) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    if (user.getUserRole() == UserRole.PENDING) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 장바구니를 이용할 수 없습니다.");
    }

    Cart cart = cartRepository.findByUser(user)
        .orElseThrow(() -> new IllegalArgumentException("장바구니가 존재하지 않습니다."));

    CartItem cartItem = cartItemRepository.findById(cartItemId)
        .orElseThrow(() -> new IllegalArgumentException("장바구니 아이템을 찾을 수 없습니다."));

    // 해당 장바구니 아이템이 현재 사용자의 장바구니에 속하는지 확인
    if (!cartItem.getCart().getId().equals(cart.getId())) {
      throw new IllegalArgumentException("해당 장바구니 아이템에 접근 권한이 없습니다.");
    }

    // 수량 직접 설정 (덮어쓰기)
    cartItem.updateQuantity(quantity);

    cartRepository.save(cart);
  }

  public void removeCartItem(Long userId, Long itemId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() == UserRole.PENDING) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 장바구니를 이용할 수 없습니다.");
    }

    Cart cart = cartRepository.findByUser(user)
        .orElseThrow(() -> new IllegalArgumentException("장바구니가 존재하지 않습니다."));

    cart.removeItem(itemId);
  }

  public void clearCart(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("아이디를 찾을 수 없습니다."));

    if (user.getUserRole() == UserRole.PENDING) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 장바구니를 이용할 수 없습니다.");
    }

    Cart cart = cartRepository.findByUser(user)
        .orElseThrow(() -> new IllegalArgumentException("장바구니가 존재하지 않습니다."));

    cart.clear();
  }
}
