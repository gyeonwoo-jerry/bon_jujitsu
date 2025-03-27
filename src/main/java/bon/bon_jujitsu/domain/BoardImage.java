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
//import lombok.AllArgsConstructor;
//import lombok.Builder;
//import lombok.Getter;
//import lombok.NoArgsConstructor;
//import org.hibernate.annotations.Where;
//
//@Entity
//@Builder
//@Getter
//@NoArgsConstructor
//@AllArgsConstructor
//@Where(clause = "is_deleted = false")
//@Table(name = "board_image")
//public class BoardImage extends Timestamped {
//  @Id
//  @GeneratedValue(strategy = GenerationType.IDENTITY)
//  private Long id;
//
//  @Column(nullable = false)
//  private String imagePath;
//
//  @ManyToOne(fetch = FetchType.LAZY)
//  @JoinColumn(name = "board_id")
//  private Board board;
//
//  @Builder.Default
//  @Column(nullable = false)
//  private boolean isDeleted = false;
//
//  public void softDelete() {
//    this.isDeleted = true;
//  }
//}
