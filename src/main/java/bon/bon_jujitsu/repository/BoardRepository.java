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

  Optional<Board> findById(Long boardId);

  // 🔥 안전한 조회를 위한 커스텀 메서드 (폴백용)
  @Query("SELECT b FROM Board b " +
          "LEFT JOIN FETCH b.user u " +
          "LEFT JOIN FETCH b.branch br " +
          "WHERE (:name IS NULL OR :name = '' OR u.name LIKE %:name% OR u IS NULL) " +
          "AND (:branchId IS NULL OR br.id = :branchId) " +
          "ORDER BY b.createdAt DESC")
  Page<Board> findBoardsSafely(@Param("name") String name,
                               @Param("branchId") Long branchId,
                               Pageable pageable);

  // 🔥 단건 조회도 안전하게
  @Query("SELECT b FROM Board b " +
          "LEFT JOIN FETCH b.user u " +
          "LEFT JOIN FETCH b.branch br " +
          "WHERE b.id = :boardId")
  Optional<Board> findByIdSafely(@Param("boardId") Long boardId);
}
