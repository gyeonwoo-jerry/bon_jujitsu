package bon.bon_jujitsu.service;

import bon.bon_jujitsu.domain.Comment;
import bon.bon_jujitsu.domain.CommentType;
import bon.bon_jujitsu.domain.User;
import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.request.CommentRequest;
import bon.bon_jujitsu.dto.response.CommentResponse;
import bon.bon_jujitsu.dto.update.CommentUpdate;
import bon.bon_jujitsu.repository.BoardRepository;
import bon.bon_jujitsu.repository.CommentRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.QnARepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentService {

  private final UserRepository userRepository;
  private final CommentRepository commentRepository;
  private final BoardRepository boardRepository;
  private final NoticeRepository noticeRepository;
  private final QnARepository qnARepository;

  // 최대 댓글 깊이 상수화
  private static final int MAX_COMMENT_DEPTH = 3;

  @CacheEvict(value = "comments", key = "#request.targetId() + '_' + #request.commentType()")
  public void createComment(Long userId, CommentRequest request) {
    // 사용자 권한 검증을 별도 메서드로 분리
    User user = validateUserPermission(userId);

    // QnA 댓글 권한 검증
    validateQnaCommentPermission(request.commentType(), user);

    // 부모 댓글 검증
    Comment parentComment = validateAndGetParentComment(request.parentId());

    Comment comment = Comment.builder()
        .content(request.content())
        .parentComment(parentComment)
        .depth(parentComment != null ? parentComment.getDepth() + 1 : 0)
        .user(user)
        .commentType(request.commentType())
        .targetId(request.targetId())
        .build();

    commentRepository.save(comment);
  }

  @Transactional(readOnly = true)
  @Cacheable(value = "comments", key = "#targetId + '_' + #commentType")
  public List<CommentResponse> getComments(Long targetId, CommentType commentType) {
    // 타겟 엔티티 존재 여부 검증
    validateTargetEntity(targetId, commentType);

    // 댓글 조회 - 한 번의 쿼리로 모든 댓글과 사용자 정보를 가져옴
    List<Comment> comments = commentRepository.findByTargetIdAndCommentTypeWithUserAndBranch(
        targetId, commentType
    );

    // 계층 구조 변환
    return buildCommentTree(comments);
  }

  @CacheEvict(value = "comments", key = "#comment.targetId + '_' + #comment.commentType")
  public void updateComment(Long userId, Long commentId, CommentUpdate request) {
    Comment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

    // 권한 검증
    validateCommentOwnership(userId, comment);

    // 부모 댓글 수정 불가 검증
    validateParentCommentUpdate(comment, request);

    comment.updateComment(request.content());
  }

  @CacheEvict(value = "comments", key = "#comment.targetId + '_' + #comment.commentType")
  public void deleteComment(Long userId, Long commentId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    Comment comment = commentRepository.findById(commentId)
        .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

    // 삭제 권한 검증
    validateDeletePermission(user, comment);

    comment.softDelete();
  }

  // === 검증 메서드들 ===

  private User validateUserPermission(Long userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if (user.isAdmin()) {
      return user;
    }

    boolean hasActiveRole = user.getBranchUsers().stream()
        .anyMatch(bu -> bu.getUserRole() != UserRole.PENDING);

    if (!hasActiveRole) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 댓글을 이용할 수 없습니다.");
    }

    return user;
  }

  private void validateQnaCommentPermission(CommentType commentType, User user) {
    if (commentType == CommentType.QNA && !user.isAdmin()) {
      throw new IllegalArgumentException("QnA 댓글은 관리자만 작성할 수 있습니다.");
    }
  }

  private Comment validateAndGetParentComment(Long parentId) {
    if (parentId == null) {
      return null;
    }

    Comment parentComment = commentRepository.findById(parentId)
        .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

    if (parentComment.getDepth() >= MAX_COMMENT_DEPTH) {
      throw new IllegalArgumentException("더 이상 대댓글을 작성할 수 없습니다.");
    }

    return parentComment;
  }

  private void validateTargetEntity(Long targetId, CommentType commentType) {
    switch (commentType) {
      case BOARD -> boardRepository.findById(targetId)
          .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
      case NOTICE -> noticeRepository.findById(targetId)
          .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
      case QNA -> qnARepository.findById(targetId)
          .orElseThrow(() -> new IllegalArgumentException("QNA를 찾을 수 없습니다."));
      default -> throw new IllegalArgumentException("올바르지 않은 댓글 타입입니다.");
    }
  }

  private void validateCommentOwnership(Long userId, Comment comment) {
    if (!userId.equals(comment.getUser().getId())) {
      throw new IllegalArgumentException("댓글을 수정할 권한이 없습니다.");
    }
  }

  private void validateParentCommentUpdate(Comment comment, CommentUpdate request) {
    if (comment.getParentComment() != null && request.parentId() != null) {
      throw new IllegalArgumentException("부모 댓글은 수정할 수 없습니다.");
    }
  }

  private void validateDeletePermission(User user, Comment comment) {
    if (!user.isAdmin() && !comment.getUser().getId().equals(user.getId())) {
      throw new IllegalArgumentException("삭제 권한이 없습니다.");
    }
  }

  // === 트리 구조 빌딩 최적화 ===

  private List<CommentResponse> buildCommentTree(List<Comment> comments) {
    if (comments.isEmpty()) {
      return new ArrayList<>();
    }

    Map<Long, CommentResponse> commentMap = new HashMap<>();
    List<CommentResponse> roots = new ArrayList<>();

    // 첫 번째 패스: 모든 댓글을 CommentResponse로 변환하여 맵에 저장
    for (Comment comment : comments) {
      commentMap.put(comment.getId(), new CommentResponse(comment, new ArrayList<>()));
    }

    // 두 번째 패스: 부모-자식 관계 설정
    for (Comment comment : comments) {
      CommentResponse commentResponse = commentMap.get(comment.getId());

      if (comment.getParentComment() != null) {
        CommentResponse parent = commentMap.get(comment.getParentComment().getId());
        if (parent != null) {
          parent.childComments().add(commentResponse);
        }
      } else {
        roots.add(commentResponse);
      }
    }

    // 각 레벨에서 생성 시간 순으로 정렬
    sortCommentsByCreatedAt(roots);

    return roots;
  }

  private void sortCommentsByCreatedAt(List<CommentResponse> comments) {
    comments.sort((c1, c2) -> c2.createdAt().compareTo(c1.createdAt()));

    for (CommentResponse comment : comments) {
      if (!comment.childComments().isEmpty()) {
        sortCommentsByCreatedAt(comment.childComments());
      }
    }
  }
}