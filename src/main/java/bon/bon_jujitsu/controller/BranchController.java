package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.request.BranchRequest;
import bon.bon_jujitsu.dto.response.BranchDetailResponse;
import bon.bon_jujitsu.dto.response.BranchResponse;
import bon.bon_jujitsu.dto.update.BranchUpdate;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.BranchService;
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
public class BranchController {

  private final BranchService branchService;

  @PostMapping("/branch")
  public ResponseEntity<Status> createBranch(
      @AuthenticationUserId Long id,
      @Valid @RequestBody BranchRequest request
  ) {
    branchService.createBranch(id, request);
    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(Status.createStatusDto(HttpStatus.CREATED, "지부 생성 완료"));
  }

  @GetMapping("/branch/{branchId}")
  public ResponseEntity<BranchDetailResponse> getBranch(
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
      @AuthenticationUserId Long id,
      @Valid @RequestBody BranchUpdate update
  ) {
    return ResponseEntity
        .status(HttpStatus.OK)
        .body(branchService.updateBranch(id, update));
  }

  @DeleteMapping("/branch")
  public ResponseEntity<Status> deleteBranch(
      @AuthenticationUserId Long id
  ) {
    branchService.deleteBranch(id);
    return ResponseEntity.noContent().build();
  }
}
