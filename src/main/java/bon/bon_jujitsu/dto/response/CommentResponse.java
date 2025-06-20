package bon.bon_jujitsu.dto.response;

import bon.bon_jujitsu.domain.Comment;
import bon.bon_jujitsu.domain.CommentType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public record CommentResponse (
    Long id,
    String content,
    int depth,
    Long parentId,
    String name,
    Long userId,
    CommentType commentType,
    Long targetId,
    LocalDateTime createdAt,
    LocalDateTime modifiedAt,
    List<CommentResponse> childComments
) {
  public CommentResponse(Comment comment, List<CommentResponse> childComments) {
    this(
        comment.getId(),
        comment.getContent(),
        comment.getDepth(),
        Optional.ofNullable(comment.getParentComment()).map(Comment::getId).orElse(null),
        comment.getUser().getName(),
        comment.getUser().getId(),
        comment.getCommentType(),
        comment.getTargetId(),
        comment.getCreatedAt(),
        comment.getModifiedAt(),
        childComments
    );
  }
}