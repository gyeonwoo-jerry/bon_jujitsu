package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.domain.CommentType;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.CommentRequest;
import bon.bon_jujitsu.dto.response.CommentResponse;
import bon.bon_jujitsu.dto.update.CommentUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CommentController {

  private final CommentService commentService;

  @PostMapping("/comment")
  public ResponseEntity<Status> createComment(
      @AuthenticationUserId Long userId,
      @Valid @RequestBody CommentRequest request
  ) {
    commentService.createComment(userId, request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED,"댓글 등록 완료"));
  }

  @GetMapping("/comment")
  public ResponseEntity<List<CommentResponse>> getComments(
      @RequestParam Long targetId,
      @RequestParam CommentType commentType
  ) {
    List<CommentResponse> comments = commentService.getComments(targetId, commentType);
    return ResponseEntity.ok(comments);
  }

  @PatchMapping("/comment/{commentId}")
  public ResponseEntity<Status> updateComment(
      @AuthenticationUserId Long userId,
      @PathVariable("commentId") Long commentId,
      @Valid @RequestBody CommentUpdate request
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(commentService.updateComment(userId, commentId, request));
  }

  @DeleteMapping("/comment/{commentId}")
  private ResponseEntity<Void> deleteComment(
      @AuthenticationUserId Long userId,
      @PathVariable("commentId") Long commentId
  ) {
    commentService.deleteComment(userId, commentId);
    return ResponseEntity.noContent().build();
  }
}
