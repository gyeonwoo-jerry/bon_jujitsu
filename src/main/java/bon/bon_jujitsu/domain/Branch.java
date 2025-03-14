package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
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
@Table(name = "branches")
public class Branch extends Timestamped {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(unique = true, nullable = false)
  private String region;

  @Column(unique = true, nullable = false)
  private String address;

  @Builder.Default
  @Column(nullable = false)
  private boolean isDeleted = false;

  public void updateBranch(BranchUpdate branchUpdate) {
    branchUpdate.region().ifPresent(region -> {
      if (!region.isBlank()) this.region = region;
    });

    branchUpdate.address().ifPresent(address -> {
      if (!address.isBlank()) this.address = address;
    });
  }

  public void softDelte() {
    this.isDeleted = true;
  }
}
