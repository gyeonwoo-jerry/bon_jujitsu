package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BranchRequest;
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
  public ResponseEntity<Status> createBranch(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid BranchRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    branchService.createBranch(userId, request, images);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "지부 생성 완료"));
  }

  @GetMapping("/branch/{branchId}")
  public ResponseEntity<BranchResponse> getBranch(
      @PathVariable("branchId") Long branchId
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(branchService.getBranch(branchId));
  }

  @GetMapping("/branch/all")
  public ResponseEntity<PageResponse<BranchResponse>> getAllBranch(
      @RequestParam(defaultValue = "0", name = "page") int page,
      @RequestParam(defaultValue = "10", name = "size") int size
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(branchService.getAllBranch(page, size));
  }

  @PatchMapping("/branch")
  public ResponseEntity<Status> updateBranch(
      @AuthenticationUserId Long userId,
      @RequestPart("update") @Valid BranchUpdate update,
      @RequestPart(value = "images", required = false) List<MultipartFile> images
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(branchService.updateBranch(userId, update, images));
  }

  @DeleteMapping("/branch")
  public ResponseEntity<Status> deleteBranch(
      @AuthenticationUserId Long userId
  ) {
    branchService.deleteBranch(userId);
    return ResponseEntity.noContent().build();
  }
}
