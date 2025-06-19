package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.BranchImage;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BranchImageRepository extends JpaRepository<BranchImage, Long> {
    List<BranchImage> findByBranchId(Long id);

    @Query("SELECT bi FROM BranchImage bi " +
        "WHERE bi.branch.id IN :branchIds")
    List<BranchImage> findByBranchIdIn(@Param("branchIds") Set<Long> branchIds);
}
