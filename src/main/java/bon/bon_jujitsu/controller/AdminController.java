package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.ListResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

  private final UserService userService;

  @PostMapping("/assign-owner/{targetUserId}")
  public ApiResponse<Status> assignOwner(
          @AuthenticationUserId Long adminUserId,
          @PathVariable Long targetUserId) {
    Status response = userService.assignOwnerRole(adminUserId, targetUserId);
    return ApiResponse.success("관장 등록 완료", response);
  }

  @GetMapping("/users")
  public ApiResponse<PageResponse<UserResponse>> getAllUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    PageResponse<UserResponse> response = userService.getUsers(page, size, userId);
    return ApiResponse.success("회원 조회 성공", response);
  }

  @GetMapping("/users/deleted")
  public ApiResponse<PageResponse<UserResponse>> getDeletedUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    PageResponse<UserResponse> response = userService.getDeletedUsers(page, size, userId);
    return ApiResponse.success("삭제된 회원 조회 성공", response);
  }

//  @PostMapping("/{targetUserId}")
//  public ResponseEntity<Status> assignAdmin(@PathVariable("targetUserId") Long targetUserId) {
//    Status response = userService.assignAdmin(targetUserId);
//    return ResponseEntity.status(HttpStatus.OK).body(response);
//  }
}
