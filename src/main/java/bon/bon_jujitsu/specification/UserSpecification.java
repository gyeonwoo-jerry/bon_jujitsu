package bon.bon_jujitsu.specification;

import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {

  // ADMIN용 - 단일 branchId로 검색
  public static Specification<User> withFilters(String name, UserRole role, Long branchId) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // 이름 검색 (LIKE '%name%')
      if (name != null && !name.isBlank()) {
        predicates.add(criteriaBuilder.like(root.get("name"), "%" + name + "%"));
      }

      // BranchUser와 조인 (항상 필요)
      Join<User, BranchUser> branchUserJoin = root.join("branchUsers", JoinType.INNER);

      // 역할 검색
      if (role != null) {
        predicates.add(criteriaBuilder.equal(branchUserJoin.get("userRole"), role));
      }

      // 브랜치 검색
      if (branchId != null) {
        predicates.add(criteriaBuilder.equal(branchUserJoin.get("branch").get("id"), branchId));
      }

      // 삭제되지 않은 유저만 조회
      predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }

  // OWNER용 - 여러 branchId로 검색
  public static Specification<User> withFilters(String name, UserRole role, List<Long> branchIds) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // 이름 검색
      if (name != null && !name.isBlank()) {
        predicates.add(criteriaBuilder.like(root.get("name"), "%" + name + "%"));
      }

      // BranchUser와 조인 (항상 필요)
      Join<User, BranchUser> branchUserJoin = root.join("branchUsers", JoinType.INNER);

      // 역할 검색
      if (role != null) {
        predicates.add(criteriaBuilder.equal(branchUserJoin.get("userRole"), role));
      }

      // 지부 ID 제한 (OWNER의 지부들만)
      if (branchIds != null && !branchIds.isEmpty()) {
        CriteriaBuilder.In<Long> inClause = criteriaBuilder.in(branchUserJoin.get("branch").get("id"));
        for (Long id : branchIds) {
          inClause.value(id);
        }
        predicates.add(inClause);
      }

      // 삭제되지 않은 유저만 조회
      predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
