package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.ReviewRequest;
import bon.bon_jujitsu.dto.response.ReviewResponse;
import bon.bon_jujitsu.dto.response.ReviewResponseDTO;
import bon.bon_jujitsu.dto.update.ReviewUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.ReviewService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
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
public class ReviewController {

  private final ReviewService reviewService;

  @PostMapping("/reviews")
  public ApiResponse<Void> createReview(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid ReviewRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    reviewService.createReview(userId, request, images);
    return ApiResponse.success("리뷰 생성 완료", null);
  }

  @GetMapping("/reviews/{itemId}")
  public ApiResponse<PageResponse<ReviewResponse>> getReviews(
      @PathVariable("itemId") Long itemId,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ApiResponse.success(
            "리뷰 리스트 조회 완료",
            reviewService.getReviews(itemId, PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "createdAt"))));
  }

  @GetMapping("/reviews")
  public ApiResponse<PageResponse<ReviewResponse>> getMyReviews(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ApiResponse.success(
            "리뷰 리스트 조회 완료",
        reviewService.getMyReviews(userId, PageRequest.of(Math.max(0, page - 1), size, Sort.by(Sort.Direction.DESC, "createdAt"))));
  }

  @PatchMapping("/reviews/{reviewId}")
  public ApiResponse<Void> updateReview(
      @AuthenticationUserId Long userId,
      @PathVariable("reviewId") Long reviewId,
      @RequestPart("update") @Valid ReviewUpdate update,
      @RequestPart(value = "images", required = false) List<MultipartFile> images,
      @RequestPart(value = "keepImageIds", required = false) List<Long> keepImageIds
  ) {
    reviewService.updateReview(userId, reviewId, update, images, keepImageIds);
    return ApiResponse.success("리뷰 수정 완료", null);
  }

  @DeleteMapping("/reviews/{reviewId}")
  public ApiResponse<Void> deleteReview(
      @AuthenticationUserId Long userId,
      @PathVariable("reviewId") Long reviewId
  ) {
    reviewService.deleteReview(userId, reviewId);
    return ApiResponse.success("리뷰 삭제 완료", null);
  }
}
