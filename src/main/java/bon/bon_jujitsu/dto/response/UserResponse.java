package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.*;

import java.time.LocalDateTime;
import java.util.List;

import lombok.Builder;

@Builder
public record UserResponse(
    Long id,
    String name,
    String memberId,
    String email,
    String phoneNum,
    String address,
    String birthday,
    String gender,
    String region,
    int level,
    Stripe stripe,
    UserRole userRole,
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  public static UserResponse fromEntity(User user) {
    return UserResponse.builder()
        .id(user.getId())
        .name(user.getName())
        .memberId(user.getMemberId())
        .email(user.getEmail())
        .phoneNum(user.getPhoneNum())
        .address(user.getAddress())
        .birthday(user.getBirthday())
        .gender(user.getGender())
        .region(user.getBranch().getRegion())
        .level(user.getLevel())
        .stripe(user.getStripe())
        .userRole(user.getUserRole())
        .images(user.getImages().stream().map(UserImage::getImagePath).toList())
        .createdAt(user.getCreatedAt())
        .modifiedAT(user.getModifiedAt())
        .build();
  }
}
