package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.ReviewRequest;
import bon.bon_jujitsu.dto.response.ReviewResponse;
import bon.bon_jujitsu.dto.update.ReviewUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ReviewController {

  private final ReviewService reviewService;

  @PostMapping("/reviews")
  public ResponseEntity<Status> createReview(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid ReviewRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    reviewService.createReview(userId, request, images);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "리뷰등록 완료"));
  }

  @GetMapping("/reviews/{itemId}")
  public ResponseEntity<PageResponse<ReviewResponse>> getReviews(
      @PathVariable("itemId") Long itemId,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(reviewService.getReviews(itemId, PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "createdAt"))));
  }

  @GetMapping("/reviews")
  public ResponseEntity<PageResponse<ReviewResponse>> getMyReviews(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(reviewService.getMyReviews(userId, PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "createdAt"))));
  }

  @PatchMapping("/reviews/{reviewId}")
  public ResponseEntity<Status> updateReview(
      @AuthenticationUserId Long userId,
      @PathVariable("reviewId") Long reviewId,
      @RequestPart("update") @Valid ReviewUpdate request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(reviewService.updateReview(userId, reviewId, request, images));
  }

  @DeleteMapping("/reviews/{reviewId}")
  public ResponseEntity<Void> deleteReview(
      @AuthenticationUserId Long userId,
      @PathVariable("reviewId") Long reviewId
  ) {
    reviewService.deleteReview(userId, reviewId);
    return ResponseEntity.noContent().build();
  }
}
