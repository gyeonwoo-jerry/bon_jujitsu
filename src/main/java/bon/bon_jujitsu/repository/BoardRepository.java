package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Board;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BoardRepository extends JpaRepository<Board, Long>,
        JpaSpecificationExecutor<Board> {

  Optional<Board> findById(Long boardId);

  // 🔥 단건 조회도 안전하게
  @Query("SELECT b FROM Board b " +
          "LEFT JOIN FETCH b.user u " +
          "LEFT JOIN FETCH b.branch br " +
          "WHERE b.id = :boardId")
  Optional<Board> findByIdSafely(@Param("boardId") Long boardId);

  // 게시글 목록을 댓글 수와 함께 조회
  @Query("SELECT b, COALESCE(COUNT(c), 0) as commentCount FROM Board b " +
      "LEFT JOIN Comment c ON c.targetId = b.id AND c.commentType = 'BOARD' AND c.isDeleted = false " +
      "LEFT JOIN FETCH b.user " +
      "LEFT JOIN FETCH b.branch " +
      "WHERE b.isDeleted = false " +
      "AND (:name IS NULL OR b.user.name LIKE %:name%) " +
      "AND (:branchId IS NULL OR b.branch.id = :branchId) " +
      "GROUP BY b.id, b.user.id, b.branch.id " +
      "ORDER BY b.createdAt DESC")
  Page<Object[]> findBoardsWithCommentCount(
      @Param("name") String name,
      @Param("branchId") Long branchId,
      Pageable pageable
  );

  // 특정 게시글의 댓글 수 조회
  @Query("SELECT COUNT(c) FROM Comment c " +
      "WHERE c.targetId = :boardId AND c.commentType = 'BOARD' AND c.isDeleted = false")
  Long countCommentsByBoardId(@Param("boardId") Long boardId);
}
