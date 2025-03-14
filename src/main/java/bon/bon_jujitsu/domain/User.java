package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
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

@Entity
@Getter
@Where(clause = "is_deleted = false")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Table(name = "users")
@Builder
public class User extends Timestamped {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false)
  private String name;

  @Column(unique = true, nullable = false)
  private String nickname;

  @Column(nullable = false)
  private String password;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(unique = true, nullable = false)
  private String phoneNum;

  @Column(unique = true, nullable = false)
  private String address;

  @Column(nullable = false)
  private String birthday;

  @Column(nullable = false)
  private String gender;

  private int level;

  @Enumerated(EnumType.STRING)
  private Stripe stripe;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private UserRole userRole;

  @Column
  @Builder.Default
  private boolean isDeleted = false;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "branch_id",nullable = false)
  private Branch branch;

  @Builder.Default
  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Order> orderList = new ArrayList<>();

  public void softDelete() {
    this.isDeleted = true;
  }

  public void updateProfile(ProfileUpdateRequest request) {
    request.name().ifPresent(value -> {
      if (!value.isBlank()) this.name = value;
    });

    request.nickname().ifPresent(value -> {
      if (!value.isBlank()) this.nickname = value;
    });

    request.email().ifPresent(value -> {
      if (!value.isBlank()) this.email = value;
    });

    request.phoneNum().ifPresent(value -> {
      if (!value.isBlank()) this.phoneNum = value;
    });

    request.address().ifPresent(value -> {
      if (!value.isBlank()) this.address = value;
    });

    request.birthday().ifPresent(value -> {
      if (!value.isBlank()) this.birthday = value;
    });

    request.gender().ifPresent(value -> {
      if (!value.isBlank()) this.gender = value;
    });

    request.level().ifPresent(value -> {
      if (value > 0) this.level = value;
    });

    request.stripe().ifPresent(value -> this.stripe = value);
  }

  public void changePassword(String newPassword) {
    if (newPassword != null && !newPassword.isBlank()) {
      this.password = newPassword;
    }
  }

  public void setUserRole(UserRole userRole) {
    this.userRole = userRole;
  }

  public void setBranch(Branch branch) {
    this.branch = branch;
  }
}


