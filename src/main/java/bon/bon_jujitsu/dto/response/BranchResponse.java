package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.*;

import java.time.LocalDateTime;
import java.util.List;

public record BranchResponse (
        Long id,
        String region,
        String address,
        String area,
        String content,
        List<String> images,
        LocalDateTime createdAt,
        LocalDateTime modifiedAT,
        OwnerInfo owner,
        CoachInfo coach
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



  public static BranchResponse from(Branch branch, User owner, User coach) {
    OwnerInfo ownerInfo = owner != null ?
            new OwnerInfo(
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

    CoachInfo coachInfo = coach != null ?
            new CoachInfo(
                    coach.getName(),
                    coach.getLevel(),
                    coach.getStripe(),
                    coach.getImages().stream().map(UserImage::getImagePath).toList()
            ) : null;

    return new BranchResponse(
            branch.getId(),
            branch.getRegion(),
            branch.getAddress(),
            branch.getArea(),
            branch.getContent(),
            branch.getImages().stream().map(BranchImage::getImagePath).toList(),
            branch.getCreatedAt(),
            branch.getModifiedAt(),
            ownerInfo,
            coachInfo
    );
  }

  public static BranchResponse from(Branch branch, User owner) {
    OwnerInfo ownerInfo = owner != null ?
            new OwnerInfo(
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

    return new BranchResponse(
            branch.getId(),
            branch.getRegion(),
            branch.getAddress(),
            branch.getArea(),
            branch.getContent(),
            branch.getImages().stream().map(BranchImage::getImagePath).toList(),
            branch.getCreatedAt(),
            branch.getModifiedAt(),
            ownerInfo,
            null
    );
  }
}
