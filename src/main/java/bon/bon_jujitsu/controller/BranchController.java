package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BranchRequest;
import bon.bon_jujitsu.dto.response.BoardResponse;
import bon.bon_jujitsu.dto.response.BranchResponse;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.BranchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class BranchController {

  private final BranchService branchService;

  @PostMapping("/branch")
  public ApiResponse<Void> createBranch(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid BranchRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    branchService.createBranch(userId, request, images);
    return ApiResponse.success("지부 생성 완료", null);
  }

  @GetMapping("/branch/{branchId}")
  public ApiResponse<BranchResponse> getBranch(
      @PathVariable("branchId") Long branchId
  ) {
    return ApiResponse.success("지부 조회 성공", branchService.getBranch(branchId));
  }

  @GetMapping("/branch/all")
  public ApiResponse<PageResponse<BranchResponse>> getAllBranch(
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    PageResponse<BranchResponse> branchList = branchService.getAllBranch(page, size);
    return ApiResponse.success("지부 목록 조회 성공", branchList);
  }

  @PatchMapping("/branch")
  public ApiResponse<Void> updateBranch(
      @AuthenticationUserId Long userId,
      @RequestPart("update") @Valid BranchUpdate update,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    branchService.updateBranch(userId, update, images);
    return ApiResponse.success("지부 수정 성공", null);
  }

  @DeleteMapping("/branch")
  public ApiResponse<Void> deleteBranch(
      @AuthenticationUserId Long userId
  ) {
    branchService.deleteBranch(userId);
    return ApiResponse.success("지부 삭제 성공", null);
  }
}
