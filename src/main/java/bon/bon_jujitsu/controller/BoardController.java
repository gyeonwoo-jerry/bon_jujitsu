package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.BoardRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.update.BoardUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.BoardService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BoardController {

  private final BoardService boardService;

  @PostMapping("/board/{branchId}")
  public ApiResponse<Void> createBoard(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid BoardRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      @PathVariable("branchId") Long branchId
  ) {
    boardService.createBoard(userId, request, images, branchId);
    return ApiResponse.success("게시판 생성 완료", null);
  }

  @GetMapping("/board")
  public ApiResponse<PageResponse<BoardResponse>> getBoards (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    PageResponse<BoardResponse> boardList = boardService.getBoards(page, size);
    return ApiResponse.success("게시판 목록 조회 성공", boardList);
  }

  @GetMapping("/board/{boardId}")
  public ApiResponse<BoardResponse> getBoard(
      @PathVariable("boardId") Long boardId
  ) {
    return ApiResponse.success("게시판 조회 성공", boardService.getBoard(boardId));
  }

  @PatchMapping("/board/{boardId}")
  public ApiResponse<Void> updateBoard(
      @RequestPart("update") @Valid BoardUpdate update,
      @AuthenticationUserId Long userId,
      @PathVariable("boardId") Long boardId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    boardService.updateBoard(update,userId,boardId,images);
    return ApiResponse.success("게시판 수정 성공", null);
  }

  @DeleteMapping("/board/{boardId}")
  public ApiResponse<Void> deleteBoard(
      @AuthenticationUserId Long userId,
      @PathVariable("boardId") Long boardId
  ) {
    boardService.deleteBoard(userId, boardId);
    return ApiResponse.success("게시판 삭제 성공", null);
  }
}
