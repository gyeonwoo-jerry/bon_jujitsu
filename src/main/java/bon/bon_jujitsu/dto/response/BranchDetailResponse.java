//package bon.bon_jujitsu.dto.response;
//
//import bon.bon_jujitsu.domain.Branch;
//import bon.bon_jujitsu.domain.User;
//
//import java.time.LocalDateTime;
//
//public record BranchDetailResponse (
//        Long id,
//        String region,
//        String address,
//        String area,
//        LocalDateTime createdAt,
//        LocalDateTime modifiedAT,
//        UserResponse owner
//) {
//    public static BranchDetailResponse from(Branch branch, User owner) {
//        return new BranchDetailResponse(
//                branch.getId(),
//                branch.getRegion(),
//                branch.getAddress(),
//                branch.getArea(),
//                branch.getCreatedAt(),
//                branch.getModifiedAt(),
//                owner != null ? UserResponse.fromEntity(owner) : null
//        );
//    }
//}