package bon.bon_jujitsu.specification;

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

  public static Specification<User> withFilters(String name, UserRole role, Long branchId) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // 이름 검색 (LIKE '%name%')
      if (name != null && !name.isBlank()) {
        predicates.add(criteriaBuilder.like(root.get("name"), "%" + name + "%"));
      }

      // 역할 검색 (= role)
      if (role != null) {
        predicates.add(criteriaBuilder.equal(root.get("userRole"), role));
      }

      // 브랜치 검색 (= branchId)
      if (branchId != null) {
        Join<Object, Object> branchUserJoin = root.join("branchUsers", JoinType.INNER);
        predicates.add(criteriaBuilder.equal(branchUserJoin.get("branch").get("id"), branchId));
      }

      // 삭제되지 않은 유저만 조회
      predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }

  public static Specification<User> withFilters(String name, UserRole role, List<Long> branchIds) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      if (name != null && !name.isBlank()) {
        predicates.add(criteriaBuilder.like(root.get("name"), "%" + name + "%"));
      }

      if (role != null) {
        predicates.add(criteriaBuilder.equal(root.get("userRole"), role));
      }

      if (branchIds != null && !branchIds.isEmpty()) {
        CriteriaBuilder.In<Long> inClause = criteriaBuilder.in(root.get("branch").get("id"));
        for (Long id : branchIds) {
          inClause.value(id);
        }
        predicates.add(inClause);
      }

      predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));
      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }
}
