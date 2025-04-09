package bon.bon_jujitsu.specification;

import bon.bon_jujitsu.domain.Board;
import org.springframework.data.jpa.domain.Specification;

public class BoardSpecification {

  public static Specification<Board> hasUserName(String name) {
    return (root, query, cb) -> name == null || name.isBlank() ? null :
        cb.like(cb.lower(root.get("user").get("name")), "%" + name.toLowerCase() + "%");
  }

  public static Specification<Board> hasBranchId(Long branchId) {
    return (root, query, cb) -> branchId == null ? null :
        cb.equal(root.get("branch").get("id"), branchId);
  }
}
