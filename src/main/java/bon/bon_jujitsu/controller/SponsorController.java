package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.SponsorRequest;
import bon.bon_jujitsu.dto.response.SponsorResponse;
import bon.bon_jujitsu.dto.update.SponsorUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.SponsorService;
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
public class SponsorController {

  private final SponsorService sponsorService;

  @PostMapping("/sponsor")
  public ApiResponse<Status> createSponsor(
      @AuthenticationUserId Long userId,
      @Valid @RequestPart("request") SponsorRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    sponsorService.createSponsor(userId, request, images);
    return ApiResponse.success("스폰서 생성 완료", null);
  }

  @GetMapping("/sponsor")
  public ApiResponse<PageResponse<SponsorResponse>> getSponsors (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size,
      @RequestParam(required = false) String name
  ) {
    return ApiResponse.success("스폰서 목록 조회 성공", sponsorService.getSponsors(page, size, name));
  }

  @GetMapping("/sponsor/{sponsorId}")
  public ApiResponse<SponsorResponse> getSponsor(
      @PathVariable("sponsorId") Long sponsorId,
      HttpServletRequest request
  ) {
    return ApiResponse.success("스폰서 조회 성공", sponsorService.getSponsor(sponsorId, request));
  }

  @PatchMapping("/sponsor/{sponsorId}")
  public ApiResponse<Void> updateSponsor(
      @Valid @RequestPart("update") SponsorUpdate update,
      @AuthenticationUserId Long userId,
      @PathVariable("sponsorId") Long sponsorId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      @RequestPart(value = "keepImageIds", required = false) List<Long> keepImageIds
  ) {
    sponsorService.updateSponsor(update, userId, sponsorId, images, keepImageIds);
    return ApiResponse.success("스폰서 수정 성공", null);
  }

  @DeleteMapping("/sponsor/{sponsorId}")
  private ApiResponse<Void> deleteSponsor(
      @AuthenticationUserId Long userId,
      @PathVariable("sponsorId") Long sponsorId
  ) {
    sponsorService.deleteSponsor(userId, sponsorId);
    return ApiResponse.success("스폰서 삭제 성공", null);
  }
}
