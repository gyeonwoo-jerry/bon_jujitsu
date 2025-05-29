package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Branch;
import bon.bon_jujitsu.domain.Notice;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoticeRepository extends JpaRepository<Notice, Long>,
        JpaSpecificationExecutor<Notice> {

  Optional<Notice> findTopByBranchOrderByCreatedAtDesc(Branch branch);

  // 🔥 안전한 조회를 위한 커스텀 메서드 (폴백용)
  @Query("SELECT n FROM Notice n " +
          "LEFT JOIN FETCH n.user u " +
          "LEFT JOIN FETCH n.branch br " +
          "WHERE (:name IS NULL OR :name = '' OR u.name LIKE %:name% OR u IS NULL) " +
          "AND (:branchId IS NULL OR br.id = :branchId) " +
          "ORDER BY n.createdAt DESC")
  Page<Notice> findNoticesSafely(@Param("name") String name,
                                 @Param("branchId") Long branchId,
                                 Pageable pageable);

  // 🔥 단건 조회도 안전하게
  @Query("SELECT n FROM Notice n " +
          "LEFT JOIN FETCH n.user u " +
          "LEFT JOIN FETCH n.branch br " +
          "WHERE n.id = :noticeId")
  Optional<Notice> findByIdSafely(@Param("noticeId") Long noticeId);
}
