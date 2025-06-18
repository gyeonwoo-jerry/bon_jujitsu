package bon.bon_jujitsu.specification;

import bon.bon_jujitsu.domain.BranchUser;
import bon.bon_jujitsu.domain.Stripe;
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

  /**
   * 통합된 유저 검색 조건 생성 메서드
   * @param name 이름 (부분 검색)
   * @param role 유저 역할
   * @param branchIds 지부 ID 목록 (null이면 전체, 빈 리스트면 조건 무시)
   * @param stripe 스트라이프 (벨트 색깔)
   * @return Specification<User>
   */
  public static Specification<User> withFilters(String name, UserRole role, List<Long> branchIds, Stripe stripe) {
    return (root, query, criteriaBuilder) -> {
      List<Predicate> predicates = new ArrayList<>();

      // 기본 조건: 삭제되지 않은 유저만 조회
      predicates.add(criteriaBuilder.isFalse(root.get("isDeleted")));

      // 이름 검색 (LIKE '%name%')
      addNameFilter(predicates, criteriaBuilder, root, name);

      // Stripe 검색
      addStripeFilter(predicates, criteriaBuilder, root, stripe);

      // BranchUser와 조인이 필요한 경우에만 조인
      if (needsBranchUserJoin(role, branchIds)) {
        Join<User, BranchUser> branchUserJoin = root.join("branchUsers", JoinType.INNER);

        // 역할 검색
        addRoleFilter(predicates, criteriaBuilder, branchUserJoin, role);

        // 지부 검색
        addBranchFilter(predicates, criteriaBuilder, branchUserJoin, branchIds);
      }

      return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
    };
  }

  /**
   * 이름 필터 추가
   */
  private static void addNameFilter(List<Predicate> predicates, CriteriaBuilder criteriaBuilder,
      jakarta.persistence.criteria.Root<User> root, String name) {
    if (name != null && !name.isBlank()) {
      predicates.add(criteriaBuilder.like(
          criteriaBuilder.lower(root.get("name")),
          "%" + name.toLowerCase().trim() + "%"
      ));
    }
  }

  /**
   * Stripe 필터 추가
   */
  private static void addStripeFilter(List<Predicate> predicates, CriteriaBuilder criteriaBuilder,
      jakarta.persistence.criteria.Root<User> root, Stripe stripe) {
    if (stripe != null) {
      predicates.add(criteriaBuilder.equal(root.get("stripe"), stripe));
    }
  }

  /**
   * 역할 필터 추가
   */
  private static void addRoleFilter(List<Predicate> predicates, CriteriaBuilder criteriaBuilder,
      Join<User, BranchUser> branchUserJoin, UserRole role) {
    if (role != null) {
      predicates.add(criteriaBuilder.equal(branchUserJoin.get("userRole"), role));
    }
  }

  /**
   * 지부 필터 추가
   */
  private static void addBranchFilter(List<Predicate> predicates, CriteriaBuilder criteriaBuilder,
      Join<User, BranchUser> branchUserJoin, List<Long> branchIds) {
    if (branchIds != null && !branchIds.isEmpty()) {
      predicates.add(branchUserJoin.get("branch").get("id").in(branchIds));
    }
  }

  /**
   * BranchUser 조인이 필요한지 확인
   */
  private static boolean needsBranchUserJoin(UserRole role, List<Long> branchIds) {
    return role != null || (branchIds != null && !branchIds.isEmpty());
  }

  // ============== 기존 코드와의 호환성을 위한 오버로드 메서드들 ==============

  /**
   * 단일 branchId로 검색 (ADMIN용)
   */
  public static Specification<User> withFilters(String name, UserRole role, Long branchId, Stripe stripe) {
    List<Long> branchIds = (branchId != null) ? List.of(branchId) : null;
    return withFilters(name, role, branchIds, stripe);
  }

  /**
   * Stripe 없이 검색
   */
  public static Specification<User> withFilters(String name, UserRole role, List<Long> branchIds) {
    return withFilters(name, role, branchIds, null);
  }

  /**
   * 단일 branchId, Stripe 없이 검색
   */
  public static Specification<User> withFilters(String name, UserRole role, Long branchId) {
    return withFilters(name, role, branchId, null);
  }

  // ============== 추가 편의 메서드들 ==============

  /**
   * Stripe별 전체 유저 조회
   */
  public static Specification<User> byStripe(Stripe stripe) {
    return withFilters(null, null, (List<Long>) null, stripe);
  }

  /**
   * 특정 지부의 특정 Stripe 유저들 조회
   */
  public static Specification<User> byBranchAndStripe(Long branchId, Stripe stripe) {
    return withFilters(null, null, branchId, stripe);
  }

  /**
   * 특정 역할의 특정 Stripe 유저들 조회
   */
  public static Specification<User> byRoleAndStripe(UserRole role, Stripe stripe) {
    return withFilters(null, role, (List<Long>) null, stripe);
  }

  /**
   * 이름으로만 검색
   */
  public static Specification<User> byName(String name) {
    return withFilters(name, null, (List<Long>) null, null);
  }

  /**
   * 역할로만 검색
   */
  public static Specification<User> byRole(UserRole role) {
    return withFilters(null, role, (List<Long>) null, null);
  }

  /**
   * 지부로만 검색
   */
  public static Specification<User> byBranch(Long branchId) {
    return withFilters(null, null, branchId, null);
  }

  /**
   * 여러 지부로 검색
   */
  public static Specification<User> byBranches(List<Long> branchIds) {
    return withFilters(null, null, branchIds, null);
  }
}