package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.BranchImage;
import bon.bon_jujitsu.domain.User;

import java.time.LocalDateTime;
import java.util.List;

public record BranchResponse (
        Long id,
        String region,
        String address,
        String area,
        List<String> images,
        LocalDateTime createdAt,
        LocalDateTime modifiedAT,
        OwnerInfo owner
) {
  public record OwnerInfo(
          String name,
          String phoneNum,
          String sns1,
          String sns2,
          String sns3,
          String sns4,
          String sns5
  ) {}

  public static BranchResponse from(Branch branch, User owner) {
    OwnerInfo ownerInfo = owner != null ?
            new OwnerInfo(
                    owner.getName(),
                    owner.getPhoneNum(),
                    owner.getSns1(),
                    owner.getSns2(),
                    owner.getSns3(),
                    owner.getSns4(),
                    owner.getSns5()
            ) : null;

    return new BranchResponse(
            branch.getId(),
            branch.getRegion(),
            branch.getAddress(),
            branch.getArea(),
            branch.getImages().stream().map(BranchImage::getImagePath).toList(),
            branch.getCreatedAt(),
            branch.getModifiedAt(),
            ownerInfo
    );
  }
}
