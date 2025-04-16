package bon.bon_jujitsu.domain;

import bon.bon_jujitsu.common.Timestamped;
import bon.bon_jujitsu.dto.update.ProfileUpdate;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
  private String memberId;

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

  private String sns1;

  private String sns2;

  private String sns3;

  private String sns4;

  private String sns5;

  @Enumerated(EnumType.STRING)
  private Stripe stripe;

  @Column
  @Builder.Default
  private boolean isDeleted = false;

  @Column(nullable = false)
  @Builder.Default
  private boolean isAdmin = false;

  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<BranchUser> branchUsers = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<Order> orderList = new ArrayList<>();

  @Builder.Default
  @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
  private List<UserImage> images = new ArrayList<>();

  public void softDelete() {
    this.isDeleted = true;
  }

  public void updateProfile(ProfileUpdate request) {
    request.name().ifPresent(value -> {
      if (!value.isBlank()) {
        this.name = value;
      }
    });

    request.memberId().ifPresent(value -> {
      if (!value.isBlank()) {
        this.memberId = value;
      }
    });

    request.email().ifPresent(value -> {
      if (!value.isBlank()) {
        this.email = value;
      }
    });

    request.phoneNum().ifPresent(value -> {
      if (!value.isBlank()) {
        this.phoneNum = value;
      }
    });

    request.address().ifPresent(value -> {
      if (!value.isBlank()) {
        this.address = value;
      }
    });

    request.birthday().ifPresent(value -> {
      if (!value.isBlank()) {
        this.birthday = value;
      }
    });

    request.gender().ifPresent(value -> {
      if (!value.isBlank()) {
        this.gender = value;
      }
    });

    request.level().ifPresent(value -> {
      if (value > 0) {
        this.level = value;
      }
    });

    request.stripe().ifPresent(value -> this.stripe = value);

    request.sns1().ifPresent(value -> {this.sns1 = value;});

    request.sns2().ifPresent(value -> {this.sns2 = value;});

    request.sns3().ifPresent(value -> {this.sns3 = value;});

    request.sns4().ifPresent(value -> {this.sns4 = value;});

    request.sns5().ifPresent(value -> {this.sns5 = value;});
  }

  public void changePassword(String newPassword) {
    if (newPassword != null && !newPassword.isBlank()) {
      this.password = newPassword;
    }
  }

  public boolean isAdminUser() {
    return Boolean.TRUE.equals(this.isAdmin);
  }
}


