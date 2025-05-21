package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
    return from(branch, owner, List.of()); // 코치가 없을 때 대응
  }

  public static BranchResponse from(Branch branch, User owner, List<User> coaches) {
    OwnerInfo ownerInfo = owner != null ? new OwnerInfo(
        owner.getName(),
        owner.getPhoneNum(),
        owner.getSns1(),
        owner.getSns2(),
        owner.getSns3(),
        owner.getSns4(),
        owner.getSns5(),
        owner.getLevel(),
        owner.getStripe(),
        owner.getImages().stream().map(UserImage::getImagePath).toList()
    ) : null;

    List<CoachInfo> coachInfos = coaches.stream()
        .map(coach -> new CoachInfo(
            coach.getName(),
            coach.getLevel(),
            coach.getStripe(),
            coach.getImages().stream().map(UserImage::getImagePath).toList()
        ))
        .toList();

    // BranchImage를 ImageResponse로 변환
    List<ImageResponse> imageResponses = branch.getImages().stream()
        .map(branchImage -> new ImageResponse(
            branchImage.getId(),
            branchImage.getImagePath()
        ))
        .collect(Collectors.toList());

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
}