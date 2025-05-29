package bon.bon_jujitsu.specification;

import bon.bon_jujitsu.domain.Notice;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

public class NoticeSpecification {

  public static Specification<Notice> hasUserName(String name) {
    return (root, query, cb) -> {
      if (name == null || name.isBlank()) {
        return cb.conjunction(); // 조건 없음
      }

      // 🔥 LEFT JOIN으로 탈퇴한 회원도 포함
      var userJoin = root.join("user", JoinType.LEFT);

      return cb.or(
              cb.like(cb.lower(userJoin.get("name")), "%" + name.toLowerCase() + "%"),
              cb.isNull(userJoin.get("id")) // 탈퇴한 회원 (User가 null인 경우)
      );
    };
  }

  public static Specification<Notice> hasBranchId(Long branchId) {
    return (root, query, cb) -> branchId == null ? cb.conjunction() :
            cb.equal(root.get("branch").get("id"), branchId);
  }

  // 🔥 추가: 탈퇴한 회원 포함 조회용
  public static Specification<Notice> includeDeletedUsers() {
    return (root, query, cb) -> {
      // User를 LEFT JOIN으로 연결하여 탈퇴한 회원도 포함
      root.join("user", JoinType.LEFT);
      return cb.conjunction();
    };
  }
}