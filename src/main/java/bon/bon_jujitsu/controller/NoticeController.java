package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.NoticeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
public class NoticeController {

  private final NoticeService noticeService;

  @PostMapping("/notice/{branchId}")
  public ResponseEntity<Status> createNotice(
      @AuthenticationUserId Long id,
      @Valid @RequestPart("request") NoticeRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      @PathVariable("branchId") Long branchId
  ) {
    noticeService.createNotice(id, request, images, branchId);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "공지사항 생성 완료"));
  }

  @GetMapping("/notice")
  public ResponseEntity<PageResponse<NoticeResponse>> getNotices (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(noticeService.getNotices(page, size));
  }

  @GetMapping("/notice/{noticeId}")
  public ResponseEntity<NoticeResponse> getNotice(
      @PathVariable("noticeId") Long noticeId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(noticeService.getNotice(noticeId));
  }

  @PatchMapping("/notice/{noticeId}")
  public ResponseEntity<Status> updateNotice(
      @Valid @RequestPart("update") NoticeUpdate update,
      @AuthenticationUserId Long id,
      @PathVariable("noticeId") Long noticeId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(noticeService.updateNotice(update, id, noticeId, images));
  }

  @DeleteMapping("/notice/{noticeId}")
  private ResponseEntity<Status> deleteNotice(
      @AuthenticationUserId Long id,
      @PathVariable("noticeId") Long noticeId
  ) {
    noticeService.deleteNotice(id, noticeId);
    return ResponseEntity.noContent().build();
  }
}
