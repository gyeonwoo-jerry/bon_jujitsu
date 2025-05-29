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
import bon.bon_jujitsu.repository.NewsRepository;
import bon.bon_jujitsu.repository.NoticeRepository;
import bon.bon_jujitsu.repository.SponsorRepository;
import bon.bon_jujitsu.repository.UserRepository;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
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
  private final NewsRepository newsRepository;
  private final SponsorRepository sponsorRepository;

  public void createComment(Long userId, CommentRequest request) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    if (user.getBranchUsers().stream()
        .noneMatch(bu -> bu.getUserRole() != UserRole.PENDING)) {
      throw new IllegalArgumentException("승인 대기 중인 사용자는 댓글을 이용할 수 없습니다.");
    }

    Comment parentComment = null;
    if (request.parentId() != null) {
      parentComment = commentRepository.findById(request.parentId())
          .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

      if (parentComment.getDepth() >= 3) {
        throw new IllegalArgumentException("더 이상 대댓글을 작성할 수 없습니다.");
      }
    }

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
  public List<CommentResponse> getComments(Long targetId, CommentType commentType) {
    // commentType 확인
    if (commentType == CommentType.BOARD) {
      boardRepository.findById(targetId)
          .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
    } else if (commentType == CommentType.NOTICE) {
      noticeRepository.findById(targetId)
          .orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
    } else {
      throw new IllegalArgumentException("올바르지 않은 댓글 타입입니다.");
    }

    // 댓글 조회
    List<Comment> comments = commentRepository.findByTargetIdAndCommentTypeAndIsDeletedFalseOrderByCreatedAtDesc(
        targetId, commentType
    );

    // 계층 구조 변환
    return buildCommentTree(comments);
  }

  // 대댓글을 포함한 트리 구조로 변환하는 메서드
  private List<CommentResponse> buildCommentTree(List<Comment> comments) {
    Map<Long, CommentResponse> commentMap = new HashMap<>();
    List<CommentResponse> roots = new ArrayList<>();

    // 모든 댓글을 매핑
    for (Comment comment : comments) {
      commentMap.put(comment.getId(), new CommentResponse(comment, new ArrayList<>()));
    }

    // 부모-자식 관계 설정
    for (Comment comment : comments) {
      if (comment.getParentComment() != null) {
        CommentResponse parent = commentMap.get(comment.getParentComment().getId());
        if (parent != null) {
          parent.childComments().add(commentMap.get(comment.getId())); // 대댓글 추가
        }
      } else {
        roots.add(commentMap.get(comment.getId())); // 부모 댓글이면 루트에 추가
      }
    }

    return roots;
  }

  public void updateComment(Long userId, Long commentId, CommentUpdate request) {
    Comment comment = commentRepository.findById(commentId).orElseThrow(()-> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

    // 사용자 검증
    if(!userId.equals(comment.getUser().getId())) {
      throw new IllegalArgumentException("댓글을 수정할 권한이 없습니다.");
    }

    // 부모 리뷰 수정 불가
    if (comment.getParentComment() != null && request.parentId() != null) {
      throw new IllegalArgumentException("부모 댓글은 수정할 수 없습니다.");
    }

    comment.updateComment(request.content());
  }

  public void deleteComment(Long userId, Long commentId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저를 찾을 수 없습니다."));

    Comment comment = commentRepository.findById(commentId).orElseThrow(()-> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

    // 사용자 검증
    if (!user.isAdmin() &&
        !comment.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("삭제 권한이 없습니다.");
    }

    comment.softDelete();
  }
}
