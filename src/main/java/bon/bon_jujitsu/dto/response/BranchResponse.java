package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchImage;
import bon.bon_jujitsu.domain.Stripe;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserImage;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public record BranchResponse (
    Long id,
    String region,
    String address,
    String area,
    String content,
    List<ImageResponse> images,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt,
    OwnerInfo owner,
    List<CoachInfo> coaches
) {
  public record OwnerInfo(
      String name,
      String phoneNum,
      String sns1,
      String sns2,
      String sns3,
      String sns4,
      String sns5,
      Integer level,
      Stripe stripe,
      List<String> userImages
  ) {}

  public record CoachInfo(
      String name,
      Integer level,
      Stripe stripe,
      List<String> userImages
  ) {}



  /**
   * 메인 from 메서드 - 모든 정보 포함
   */
  public static BranchResponse from(Branch branch, User owner, List<User> coaches, List<BranchImage> branchImages) {
    return new BranchResponse(
        branch.getId(),
        branch.getRegion(),
        branch.getAddress(),
        branch.getArea(),
        branch.getContent(),
        createImageResponses(branchImages),
        branch.getCreatedAt(),
        branch.getModifiedAt(),
        createOwnerInfo(owner),
        createCoachInfos(coaches)
    );
  }

  /**
   * 오류 발생 시 안전한 응답 생성
   */
  public static BranchResponse fromBranchOnly(Branch branch) {
    List<ImageResponse> imageResponses = Collections.emptyList();
    try {
      if (branch.getImages() != null) {
        imageResponses = createImageResponses(branch.getImages());
      }
    } catch (Exception e) {
      log.warn("Branch 이미지 처리 중 오류: branchId={}, error={}", branch.getId(), e.getMessage());
    }

    return new BranchResponse(
        branch.getId(),
        branch.getRegion(),
        branch.getAddress(),
        branch.getArea(),
        branch.getContent(),
        imageResponses,
        branch.getCreatedAt(),
        branch.getModifiedAt(),
        null,
        Collections.emptyList()
    );
  }

  // === Private Helper Methods ===

  private static List<ImageResponse> createImageResponses(List<BranchImage> branchImages) {
    if (branchImages == null || branchImages.isEmpty()) {
      return Collections.emptyList();
    }

    try {
      return branchImages.stream()
          .map(branchImage -> new ImageResponse(
              branchImage.getId(),
              branchImage.getImagePath()
          ))
          .collect(Collectors.toList());
    } catch (Exception e) {
      log.warn("BranchImage 처리 중 오류: {}", e.getMessage());
      return Collections.emptyList();
    }
  }

  private static OwnerInfo createOwnerInfo(User owner) {
    if (owner == null || owner.isDeleted()) {
      return null;
    }

    try {
      return new OwnerInfo(
          owner.getName(),
          owner.getPhoneNum(),
          owner.getSns1(),
          owner.getSns2(),
          owner.getSns3(),
          owner.getSns4(),
          owner.getSns5(),
          owner.getLevel(),
          owner.getStripe(),
          extractUserImages(owner)
      );
    } catch (Exception e) {
      log.warn("Owner 정보 생성 중 오류: userId={}, error={}", owner.getId(), e.getMessage());
      return null;
    }
  }

  private static List<CoachInfo> createCoachInfos(List<User> coaches) {
    if (coaches == null || coaches.isEmpty()) {
      return Collections.emptyList();
    }

    return coaches.stream()
        .filter(coach -> coach != null && !coach.isDeleted())
        .map(BranchResponse::createCoachInfo)
        .filter(coachInfo -> coachInfo != null)
        .collect(Collectors.toList());
  }

  private static CoachInfo createCoachInfo(User coach) {
    try {
      return new CoachInfo(
          coach.getName(),
          coach.getLevel(),
          coach.getStripe(),
          extractUserImages(coach)
      );
    } catch (Exception e) {
      log.warn("Coach 정보 생성 중 오류: userId={}, error={}", coach.getId(), e.getMessage());
      return null;
    }
  }

  private static List<String> extractUserImages(User user) {
    try {
      if (user.getImages() != null) {
        return user.getImages().stream()
            .map(UserImage::getImagePath)
            .collect(Collectors.toList());
      }
    } catch (Exception e) {
      log.warn("User 이미지 추출 중 오류: userId={}, error={}", user.getId(), e.getMessage());
    }
    return Collections.emptyList();
  }
}