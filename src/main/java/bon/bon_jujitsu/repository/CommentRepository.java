package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Comment;
import bon.bon_jujitsu.domain.CommentType;
import bon.bon_jujitsu.domain.PostType;
import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {
  @Query("SELECT c FROM Comment c " +
      "JOIN FETCH c.user u " +
      "LEFT JOIN FETCH u.branchUsers bu " +
      "WHERE c.targetId = :targetId " +
      "AND c.commentType = :commentType " +
      "AND c.isDeleted = false " +
      "ORDER BY c.createdAt DESC")
  List<Comment> findByTargetIdAndCommentTypeWithUserAndBranch(
      @Param("targetId") Long targetId,
      @Param("commentType") CommentType commentType
  );

  boolean existsByCommentTypeAndTargetId(CommentType commentType, Long id);

  @Query("SELECT DISTINCT c.targetId FROM Comment c WHERE c.commentType = 'QNA' AND c.targetId IN :qnaIds")
  List<Long> findQnaIdsWithAnswers(@Param("qnaIds") Set<Long> qnaIds);
}
