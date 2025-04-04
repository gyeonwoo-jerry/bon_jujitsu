package bon.bon_jujitsu.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "item_options")
public class ItemOption {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String size;

  @Column(nullable = false)
  private String color;

  @Column(nullable = false)
  private int amount;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "item_id", nullable = false)
  private Item item;

  public void decreaseAmount(int quantity) {
    if (this.amount < quantity) {
      throw new IllegalArgumentException("재고 부족");
    }
    this.amount -= quantity;
  }

  public void updateSize(String size) {
    this.size = size;
  }

  public void updateColor(String color) {
    this.color = color;
  }

  public void updateItemAmount(Integer amount) {
    this.amount = amount;
  }

  public void increaseAmount(int quantity) {
    this.amount += quantity;
  }
}
