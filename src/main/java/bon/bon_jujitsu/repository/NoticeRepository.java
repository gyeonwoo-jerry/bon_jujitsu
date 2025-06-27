package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Notice;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

  // N+1 문제 해결을 위한 fetch join 사용 - 목록 조회
  @Query("SELECT DISTINCT n FROM Notice n " +
      "LEFT JOIN FETCH n.user u " +
      "LEFT JOIN FETCH n.branch br " +
      "WHERE (:name IS NULL OR :name = '' OR u.name LIKE %:name%) " +
      "AND (:branchId IS NULL OR n.branch.id = :branchId) " +
      "ORDER BY n.createdAt DESC")
  Page<Notice> findNoticesWithFetchJoin(@Param("name") String name,
      @Param("branchId") Long branchId,
      Pageable pageable);

  // N+1 문제 해결을 위한 fetch join 사용 - 단건 조회
  @Query("SELECT n FROM Notice n " +
      "LEFT JOIN FETCH n.user u " +
      "LEFT JOIN FETCH n.branch br " +
      "WHERE n.id = :id")
  Optional<Notice> findByIdWithFetchJoin(@Param("id") Long id);

  // 메인 공지사항 조회 (가장 최근 것)
  Optional<Notice> findTopByBranchOrderByCreatedAtDesc(Branch branch);
}