package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BranchRepository extends JpaRepository<Branch, Long> {
  @EntityGraph(attributePaths = {"branchUsers.user"})
  @Query("SELECT b FROM Branch b WHERE b.isDeleted = false")
  Page<Branch> findAllWithOwner(Pageable pageable);

  boolean existsByRegion(String region);

  Page<Branch> findByRegionContainingIgnoreCase(String region, PageRequest pageRequest);
}
