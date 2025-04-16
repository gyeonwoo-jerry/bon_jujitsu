package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.domain.CommentType;
import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.request.CommentRequest;
import bon.bon_jujitsu.dto.response.CommentResponse;
import bon.bon_jujitsu.dto.update.CommentUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.CommentService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
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
  public ApiResponse<Void> createComment(
      @AuthenticationUserId Long userId,
      @Valid @RequestBody CommentRequest request
  ) {
    commentService.createComment(userId, request);
    return ApiResponse.success("댓글 생성 완료", null);
  }

  @GetMapping("/comment")
  public ApiResponse<List<CommentResponse>> getComments(
      @RequestParam Long targetId,
      @RequestParam CommentType commentType
  ) {
    List<CommentResponse> comments = commentService.getComments(targetId, commentType);
    return ApiResponse.success("댓글 목록 조회 성공", comments);
  }

  @PatchMapping("/comment/{commentId}")
  public ApiResponse<Void> updateComment(
      @AuthenticationUserId Long userId,
      @PathVariable("commentId") Long commentId,
      @Valid @RequestBody CommentUpdate update
  ) {
    commentService.updateComment(userId, commentId, update);
    return ApiResponse.success("댓글 수정 성공", null);
  }

  @DeleteMapping("/comment/{commentId}")
  private ApiResponse<Void> deleteComment(
      @AuthenticationUserId Long userId,
      @PathVariable("commentId") Long commentId
  ) {
    commentService.deleteComment(userId, commentId);
    return ApiResponse.success("댓글 삭제 성공", null);
  }
}
