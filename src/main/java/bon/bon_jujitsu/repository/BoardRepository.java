package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Board;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardRepository extends JpaRepository<Board, Long>,
    JpaSpecificationExecutor<Board> {

  // N+1 문제 해결을 위한 fetch join 사용 - 목록 조회
  @Query("SELECT DISTINCT b FROM Board b " +
      "LEFT JOIN FETCH b.user u " +
      "LEFT JOIN FETCH b.branch br " +
      "WHERE (:title IS NULL OR :title = '' OR b.title LIKE %:title%) " +
      "AND (:branchId IS NULL OR b.branch.id = :branchId) " +
      "ORDER BY b.createdAt DESC")
  Page<Board> findBoardsWithFetchJoin(@Param("title") String title,
      @Param("branchId") Long branchId,
      Pageable pageable);

  // N+1 문제 해결을 위한 fetch join 사용 - 단건 조회
  @Query("SELECT b FROM Board b " +
      "LEFT JOIN FETCH b.user u " +
      "LEFT JOIN FETCH b.branch br " +
      "WHERE b.id = :id")
  Optional<Board> findByIdWithFetchJoin(@Param("id") Long id);
}