package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BoardRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.BoardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
public class BoardController {

  private final BoardService boardService;

  @PostMapping("/board")
  public ResponseEntity<Status> createBoard(
      @AuthenticationUserId Long id,
      @Valid @RequestBody BoardRequest request
  ) {
    boardService.createBoard(id, request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "게시글 생성 완료"));
  }

  @GetMapping("/board")
  public ResponseEntity<PageResponse<BoardResponse>> getBoards (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(boardService.getBoards(page, size));
  }

  @GetMapping("/board/{boardId}")
  public ResponseEntity<BoardResponse> getBoard(
      @PathVariable("boardId") Long boardId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(boardService.getBoard(boardId));
  }

  @PatchMapping("/board/{boardId}")
  private ResponseEntity<Status> updateBoard(
      @Valid @RequestBody BoardUpdate update,
      @AuthenticationUserId Long id,
      @PathVariable("boardId") Long boardId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(boardService.updateBoard(update, id, boardId));
  }

  @DeleteMapping("/board/{boardId}")
  private ResponseEntity<Status> deleteBoard(
      @AuthenticationUserId Long id,
      @PathVariable("boardId") Long boardId
  ) {
    boardService.deleteBoard(id, boardId);
    return ResponseEntity.noContent().build();
  }
}
