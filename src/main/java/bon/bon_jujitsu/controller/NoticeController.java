package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.NoticeService;
import jakarta.servlet.http.HttpServletRequest;
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
public class NoticeController {

  private final NoticeService noticeService;

  @PostMapping("/notice/{branchId}")
  public ApiResponse<Void> createNotice(
      @AuthenticationUserId Long userId,
      @Valid @RequestPart("request") NoticeRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      @PathVariable("branchId") Long branchId
  ) {
    noticeService.createNotice(userId, request, images, branchId);
    return ApiResponse.success("공지사항 생성 완료", null);
  }

  @GetMapping("/notice")
  public ApiResponse<PageResponse<NoticeResponse>> getNotices (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @RequestParam(required = false) String name
  ) {
    return ApiResponse.success("공지사항 리스트 조회 완료", noticeService.getNotices(page, size, name));
  }

  @GetMapping("/notice/{noticeId}")
  public ApiResponse<NoticeResponse> getNotice(
      @PathVariable("noticeId") Long noticeId,
      HttpServletRequest request
  ) {
    return ApiResponse.success("공지사항 조회 완료", noticeService.getNotice(noticeId, request));
  }

  @PatchMapping("/notice/{noticeId}")
  public ApiResponse<Void> updateNotice(
      @Valid @RequestPart("update") NoticeUpdate update,
      @AuthenticationUserId Long userId,
      @PathVariable("noticeId") Long noticeId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    noticeService.updateNotice(update, userId, noticeId, images);
    return ApiResponse.success("공지사항 수정 완료", null);
  }

  @DeleteMapping("/notice/{noticeId}")
  private ApiResponse<Void> deleteNotice(
      @AuthenticationUserId Long userId,
      @PathVariable("noticeId") Long noticeId
  ) {
    noticeService.deleteNotice(userId, noticeId);
    return ApiResponse.success("공지사항 삭제 완료", null);
  }
}
