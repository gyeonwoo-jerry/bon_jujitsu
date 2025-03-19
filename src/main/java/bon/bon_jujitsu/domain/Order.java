package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "orders")
public class Order extends Timestamped {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(nullable = false)
  private String address;

  @Column(nullable = false)
  private String zipcode;

  @Column(nullable = false)
  private String addrDetail;

  @Column(nullable = false)
  private String phoneNum;

  @Column
  private String requirement;

  @Column(nullable = false)
  private double totalPrice;

  @Column(nullable = false)
  private int totalCount;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private PayType payType;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private OrderStatus orderStatus = OrderStatus.WAITING;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<OrderItem> orderItems = new ArrayList<>();

  public void UpdateOrderStatus(OrderStatus orderStatus) {
    this.orderStatus = orderStatus;
  }

  public void addOrderItem(OrderItem orderItem) {
    if (this.orderItems == null) {
      this.orderItems = new ArrayList<>();
    }
    this.orderItems.add(orderItem);
    orderItem.changeOrder(this);
  }

  public void updateTotalInfo(int totalPrice, int totalCount) {
    this.totalPrice = totalPrice;
    this.totalCount = totalCount;
  }
}
