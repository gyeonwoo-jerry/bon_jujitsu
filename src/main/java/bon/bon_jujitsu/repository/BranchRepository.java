package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface BranchRepository extends JpaRepository<Branch, Long> {
    @Query("SELECT b FROM Branch b JOIN b.users u WHERE u.userRole = 'OWNER'")
    Page<Branch> findAllWithOwner(Pageable pageable);

  boolean existsByRegion(String region);
}
