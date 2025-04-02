package bon.bon_jujitsu.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "cart_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "cart_id")
  private Cart cart;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "item_id")
  private Item item;

  private int quantity;

  private int price;

  @Builder
  public CartItem(Cart cart, Item item, int quantity, int price) {
    this.cart = cart;
    this.item = item;
    this.quantity = quantity;
    this.price = price;
  }

  // 수량 업데이트
  public void addQuantity(int additionalQuantity) {
    this.quantity += additionalQuantity;
  }

  // 수량 설정
  public void updateQuantity(int quantity) {
    this.quantity = quantity;
  }

  // 가격 업데이트
  public void updatePrice(int newPrice) {
    this.price = newPrice;
  }
}
