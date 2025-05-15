package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.*;

import java.time.LocalDateTime;
import java.util.List;

import java.util.stream.Collectors;
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
    int level,
    Stripe stripe,
    List<BranchUserResponse> branchUsers,  // 사용자가 속한 지점들과 각 지점에서의 역할
    List<String> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAT
) {

  // BranchUser 정보를 담기 위한 내부 레코드
  @Builder
  public record BranchUserResponse(
      String region,
      UserRole userRole,
      Long branchId
  ) {}

  public static UserResponse fromEntity(User user) {
    // 사용자가 속한 모든 지점 정보와 역할을 매핑
    List<BranchUserResponse> branchUserResponses = user.getBranchUsers().stream()
        .map(bu -> BranchUserResponse.builder()
            .region(bu.getBranch().getRegion())
            .userRole(bu.getUserRole())
            .branchId(bu.getBranch().getId())
            .build())
        .collect(Collectors.toList());

    return UserResponse.builder()
        .id(user.getId())
        .name(user.getName())
        .memberId(user.getMemberId())
        .email(user.getEmail())
        .phoneNum(user.getPhoneNum())
        .address(user.getAddress())
        .birthday(user.getBirthday())
        .gender(user.getGender())
        .level(user.getLevel())
        .stripe(user.getStripe())
        .branchUsers(branchUserResponses)
        .images(user.getImages().stream().map(UserImage::getImagePath).toList())
        .createdAt(user.getCreatedAt())
        .modifiedAT(user.getModifiedAt())
        .build();
  }
}
