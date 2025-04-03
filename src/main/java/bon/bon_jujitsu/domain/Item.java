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
  private String content;

  @Column(nullable = false)
  private int price;

  @Column
  private int sale;

  @Builder.Default
  @Column(nullable = false)
  private boolean isDeleted = false;

  @Builder.Default
  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Review> reviews = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ItemImage> images = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "item", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<ItemOption> itemOptions = new ArrayList<>();

  public void updateName(String name) {
    this.name = name;
  }

  public void updateContent(String content) {
    this.content = content;
  }

  public void updatePrice(int price) {
    this.price = price;
  }

  public void updateSale(int sale) {
    this.sale = sale;
  }

  public void softDelete() {
    this.isDeleted = true;
  }

  public void addItemOption(ItemOption itemOption) {
    this.itemOptions.add(itemOption);
  }
}
