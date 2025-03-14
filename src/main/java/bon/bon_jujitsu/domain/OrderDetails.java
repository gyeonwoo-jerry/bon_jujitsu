//package bon.bon_jujitsu.domain;
//
//import bon.bon_jujitsu.common.Timestamped;
//import jakarta.persistence.Column;
//import jakarta.persistence.Entity;
//import jakarta.persistence.FetchType;
//import jakarta.persistence.GeneratedValue;
//import jakarta.persistence.GenerationType;
//import jakarta.persistence.Id;
//import jakarta.persistence.JoinColumn;
//import jakarta.persistence.ManyToOne;
//import jakarta.persistence.Table;
//import lombok.AccessLevel;
//import lombok.AllArgsConstructor;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//
//@Entity
//@Getter
//@NoArgsConstructor(access = AccessLevel.PROTECTED)
//@AllArgsConstructor
//@Table(name = "order_details")
//public class OrderDetails extends Timestamped {
//  @Id
//  @GeneratedValue(strategy = GenerationType.IDENTITY)
//  private Long id;
//
//  @Column(nullable = false)
//  private int price;
//
//  @Column(nullable = false)
//  private int count;
//
//  @Column(nullable = false)
//  private double totalPrice;
//
//  @Column(nullable = false)
//  private boolean isDeleted = false;
//
//  @ManyToOne(fetch = FetchType.LAZY)
//  @JoinColumn(name = "order_id", nullable = false)
//  private Order order;
//
//  @ManyToOne(fetch = FetchType.LAZY)
//  @JoinColumn(name = "item_id", nullable = false)
//  private Item item;
//}
