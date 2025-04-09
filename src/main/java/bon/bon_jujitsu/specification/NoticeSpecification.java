package bon.bon_jujitsu.specification;

import bon.bon_jujitsu.domain.Notice;
import org.springframework.data.jpa.domain.Specification;

public class NoticeSpecification {

  public static Specification<Notice> hasUserName(String name) {
    return (root, query, cb) ->
        name == null || name.isBlank() ? null :
            cb.like(cb.lower(root.get("user").get("name")), "%" + name.toLowerCase() + "%");
  }

  public static Specification<Notice> hasBranchId(Long branchId) {
    return (root, query, cb) ->
        branchId == null ? null :
            cb.equal(root.get("branch").get("id"), branchId);
  }
}
