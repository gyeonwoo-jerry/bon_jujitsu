package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface BranchRepository extends JpaRepository<Branch, Long>,
    JpaSpecificationExecutor<Branch> {

  boolean existsByRegion(String region);
}
