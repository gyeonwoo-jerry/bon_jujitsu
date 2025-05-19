package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BranchRepository extends JpaRepository<Branch, Long> {
  @EntityGraph(attributePaths = {"branchUsers.user"})
  @Query("SELECT b FROM Branch b WHERE b.isDeleted = false")
  Page<Branch> findAllWithOwner(Pageable pageable);

  boolean existsByRegion(String region);

  @Query("SELECT b FROM Branch b JOIN FETCH b.branchUsers bu " +
      "WHERE (:region IS NULL OR LOWER(b.region) LIKE LOWER(CONCAT('%', :region, '%'))) " +
      "AND (:area IS NULL OR LOWER(b.area) LIKE LOWER(CONCAT('%', :area, '%')))")
  Page<Branch> findByRegionOrName(@Param("region") String region,
      @Param("area") String area,
      Pageable pageable);
}
