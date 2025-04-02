package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Builder
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "carts")
public class Cart extends Timestamped {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Builder.Default
  @OneToMany(mappedBy = "cart", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<CartItem> cartItems = new ArrayList<>();

  public void addItem(Item item, int quantity) {
    if (cartItems == null) { //null 체크 후 초기화
      cartItems = new ArrayList<>();
    }
    // 이미 있는 상품인지 확인
    for (CartItem cartItem : cartItems) {
      if (cartItem.getItem().getId().equals(item.getId())) {
        cartItem.addQuantity(quantity);
        if (cartItem.getPrice() != item.getPrice()) {
          cartItem.updatePrice(item.getPrice());
        }
        return;
      }
    }

    // 없으면 새로 추가
    CartItem cartItem = CartItem.builder()
        .cart(this)
        .item(item)
        .quantity(quantity)
        .price(item.getPrice()) // 현재 상품 가격 저장
        .build();
    cartItems.add(cartItem);
  }

  // 장바구니 아이템 삭제
  public void removeItem(Long itemId) {
    cartItems.removeIf(cartItem -> cartItem.getItem().getId().equals(itemId));
  }

  // 장바구니 비우기
  public void clear() {
    cartItems.clear();
  }
}
