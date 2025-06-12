package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BranchRepository extends JpaRepository<Branch, Long>,
    JpaSpecificationExecutor<Branch> {

  boolean existsByRegion(String region);

  @Query("SELECT DISTINCT b.area FROM Branch b WHERE b.isDeleted = false ORDER BY b.area")
  List<String> findDistinctAreas();

  @Query("SELECT DISTINCT b.region FROM Branch b WHERE b.area = :area AND b.isDeleted = false ORDER BY b.region")
  List<String> findDistinctRegionsByArea(@Param("area") String area);
}
