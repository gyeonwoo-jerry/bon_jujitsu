package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.NoticeRequest;
import bon.bon_jujitsu.dto.request.SponsorRequest;
import bon.bon_jujitsu.dto.response.NoticeResponse;
import bon.bon_jujitsu.dto.response.SponsorResponse;
import bon.bon_jujitsu.dto.update.NoticeUpdate;
import bon.bon_jujitsu.dto.update.SponsorUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.SponsorService;
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
public class SponsorController {

  private final SponsorService sponsorService;

  @PostMapping("/sponsor")
  public ResponseEntity<Status> createSponsor(
      @AuthenticationUserId Long id,
      @Valid @RequestPart("request") SponsorRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    sponsorService.createSponsor(id, request, images);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "스폰서 생성 완료"));
  }

  @GetMapping("/sponsor")
  public ResponseEntity<PageResponse<SponsorResponse>> getSponsors (
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(sponsorService.getNotices(page, size));
  }

  @GetMapping("/sponsor/{sponsorId}")
  public ResponseEntity<SponsorResponse> getSponsor(
      @PathVariable("sponsorId") Long sponsorId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(sponsorService.getSponsor(sponsorId));
  }

  @PatchMapping("/sponsor/{sponsorId}")
  public ResponseEntity<Status> updateSponsor(
      @Valid @RequestPart("update") SponsorUpdate update,
      @AuthenticationUserId Long id,
      @PathVariable("sponsorId") Long sponsorId,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(sponsorService.updateSponsor(update, id, sponsorId, images));
  }

  @DeleteMapping("/sponsor/{sponsorId}")
  private ResponseEntity<Status> deleteSponsor(
      @AuthenticationUserId Long id,
      @PathVariable("sponsorId") Long sponsorId
  ) {
    sponsorService.deleteSponsor(id, sponsorId);
    return ResponseEntity.noContent().build();
  }
}
