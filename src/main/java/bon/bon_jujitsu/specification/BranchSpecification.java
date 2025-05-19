package bon.bon_jujitsu.specification;

import bon.bon_jujitsu.domain.Branch;
import org.springframework.data.jpa.domain.Specification;

public class BranchSpecification {

  public static Specification<Branch> regionContains(String region) {
    return (root, query, cb) -> {
      if (region == null || region.isBlank()) return null;
      return cb.like(cb.lower(root.get("region")), "%" + region.toLowerCase() + "%");
    };
  }

  public static Specification<Branch> areaContains(String area) {
    return (root, query, cb) -> {
      if (area == null || area.isBlank()) return null;
      return cb.like(cb.lower(root.get("area")), "%" + area.toLowerCase() + "%");
    };
  }
}

