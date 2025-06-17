package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.*;

import java.time.LocalDateTime;
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
    LocalDateTime modifiedAT,
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

  public static BranchResponse from(Branch branch, User owner) {
    return from(branch, owner, List.of());
  }

  public static BranchResponse from(Branch branch, User owner, List<User> coaches) {
    // 안전한 OwnerInfo 생성
    OwnerInfo ownerInfo = null;
    if (owner != null && !owner.isDeleted()) { // boolean 필드 확인
      try {
        ownerInfo = new OwnerInfo(
            owner.getName(),
            owner.getPhoneNum(),
            owner.getSns1(),
            owner.getSns2(),
            owner.getSns3(),
            owner.getSns4(),
            owner.getSns5(),
            owner.getLevel(),
            owner.getStripe(),
            owner.getImages() != null ?
                owner.getImages().stream().map(UserImage::getImagePath).toList() :
                List.of()
        );
      } catch (Exception e) {
        log.warn("⚠️ Owner 정보 생성 중 오류 (User ID: {}): {}", owner.getId(), e.getMessage());
        ownerInfo = null;
      }
    }

    // 안전한 CoachInfo 목록 생성
    List<CoachInfo> coachInfos = coaches.stream()
        .filter(coach -> coach != null && !coach.isDeleted()) // boolean 필드 확인
        .map(coach -> {
          try {
            return new CoachInfo(
                coach.getName(),
                coach.getLevel(),
                coach.getStripe(),
                coach.getImages() != null ?
                    coach.getImages().stream().map(UserImage::getImagePath).toList() :
                    List.of()
            );
          } catch (Exception e) {
            log.warn("⚠️ Coach 정보 생성 중 오류 (User ID: {}): {}", coach.getId(), e.getMessage());
            return null;
          }
        })
        .filter(coachInfo -> coachInfo != null) // null 제거
        .collect(Collectors.toList());

    // 안전한 BranchImage 처리
    List<ImageResponse> imageResponses = List.of();
    try {
      if (branch.getImages() != null) {
        imageResponses = branch.getImages().stream()
            .map(branchImage -> new ImageResponse(
                branchImage.getId(),
                branchImage.getImagePath()
            ))
            .collect(Collectors.toList());
      }
    } catch (Exception e) {
      log.warn("⚠️ Branch 이미지 처리 중 오류 (Branch ID: {}): {}", branch.getId(), e.getMessage());
      imageResponses = List.of();
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
        ownerInfo,
        coachInfos
    );
  }

  // 오류 발생 시 사용할 안전한 생성 메서드
  public static BranchResponse fromBranchOnly(Branch branch) {
    List<ImageResponse> imageResponses = List.of();
    try {
      if (branch.getImages() != null) {
        imageResponses = branch.getImages().stream()
            .map(branchImage -> new ImageResponse(
                branchImage.getId(),
                branchImage.getImagePath()
            ))
            .collect(Collectors.toList());
      }
    } catch (Exception e) {
      log.warn("⚠️ Branch 이미지 처리 중 오류: {}", e.getMessage());
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
        null, // owner 없음
        List.of() // coaches 없음
    );
  }
}