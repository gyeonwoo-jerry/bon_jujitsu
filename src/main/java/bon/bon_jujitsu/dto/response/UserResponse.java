package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Stripe;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record UserResponse(
    Long id,
    String name,
    String memberId,
    String password,
    String email,
    String phoneNum,
    String address,
    String birthday,
    String gender,
    String region,
    int level,
    Stripe stripe,
    UserRole userRole,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static UserResponse fromEntity(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .name(user.getName())
        .memberId(user.getMemberId())
        .password(user.getPassword())
        .email(user.getEmail())
        .phoneNum(user.getPhoneNum())
        .address(user.getAddress())
        .birthday(user.getBirthday())
        .gender(user.getGender())
        .region(user.getBranch().getRegion())
        .level(user.getLevel())
        .stripe(user.getStripe())
        .userRole(user.getUserRole())
        .createdAt(user.getCreatedAt())
        .modifiedAT(user.getModifiedAt())
        .build();
  }
}
