package bon.bon_jujitsu.repository;

import bon.bon_jujitsu.domain.Comment;
import bon.bon_jujitsu.domain.CommentType;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CommentRepository extends JpaRepository<Comment, Long> {
  List<Comment> findByTargetIdAndCommentTypeAndIsDeletedFalseOrderByCreatedAtDesc(Long targetId, CommentType commentType);
}
