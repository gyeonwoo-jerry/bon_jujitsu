package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Where;

import java.util.ArrayList;
import java.util.List;

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

  @Column(nullable = false)
  private String area;

  @Column(nullable = false)
  private String content;

  @Builder.Default
  @Column(nullable = false)
  private boolean isDeleted = false;

  @Builder.Default
  @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<BranchUser> branchUsers = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "branch", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<BranchImage> images = new ArrayList<>();


  public void updateBranch(BranchUpdate branchUpdate) {
    branchUpdate.region().ifPresent(region -> {
      if (!region.isBlank()) this.region = region;
    });

    branchUpdate.address().ifPresent(address -> {
      if (!address.isBlank()) this.address = address;
    });

    branchUpdate.area().ifPresent(area -> {
      if (!area.isBlank()) this.area = area;
    });
  }

  public void softDelete() {
    this.isDeleted = true;
  }
}
