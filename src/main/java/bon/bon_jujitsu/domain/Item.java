package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
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

  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Review> reviews = new ArrayList<>();

  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ItemImage> images = new ArrayList<>();

  public void updateItem(String name, String size, String content, int price, int sale, int amount) {
    if (name != null && !name.isBlank()) {
      this.name = name;
    }

    if (size != null && !size.isBlank()) {
      this.size = size;
    }

    if (content != null && !content.isBlank()) {
      this.content = content;
    }

    if (price != 0) {
      this.price = price;
    }

    if (sale != 0) {
      this.sale = sale;
    }

    if (amount != 0) {
      this.amount = amount;
    }
  }

  public void softDelete() {
    this.isDeleted = true;
  }
}
