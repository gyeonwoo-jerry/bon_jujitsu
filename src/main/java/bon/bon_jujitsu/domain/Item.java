package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.ItemUpdate;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

@Builder
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Where(clause = "is_deleted = false")
@Table(name = "items")
public class Item extends Timestamped {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String name;

  @Column(nullable = false)
  private String size;

  @Column(nullable = false)
  private String content;

  @Column(nullable = false)
  private int price;

  @Column
  private int sale;

  @Column(nullable = false)
  private int amount;

  @Builder.Default
  @Column(nullable = false)
  private boolean isDeleted = false;

  @Builder.Default
  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Review> reviews = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ItemImage> images = new ArrayList<>();

  public void updateItem(ItemUpdate update) {
    update.name().ifPresent(value -> this.name = value);
    update.size().ifPresent(value -> this.size = value);
    update.content().ifPresent(value -> this.content = value);
    update.price().ifPresent(value -> this.price = value);
    update.sale().ifPresent(value -> this.sale = value);
    update.amount().ifPresent(value -> this.amount = value);
  }

  public void softDelete() {
    this.isDeleted = true;
  }

  public void decreaseAmount(int quantity) {
    if (this.amount < quantity) {
      throw new IllegalArgumentException("재고 부족: " + this.name);
    }
    this.amount -= quantity;
  }

  public void updateAmount(int newAmount) {
    this.amount = newAmount;
  }
}
