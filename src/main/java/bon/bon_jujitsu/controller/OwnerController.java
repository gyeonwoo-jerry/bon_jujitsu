package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.ListResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/owners")
@RequiredArgsConstructor
public class OwnerController {

  private final UserService userService;

  @GetMapping("/users")
  public ApiResponse<PageResponse<UserResponse>> getMyUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    PageResponse<UserResponse> response = userService.getMyUsers(userId, page, size);
    return ApiResponse.success("체육관 회원 조회 완료", response);
  }

  @GetMapping("/users/pending")
  public ApiResponse<PageResponse<UserResponse>> getPendingUsers(
          @AuthenticationUserId Long userId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size
  ) {
    PageResponse<UserResponse> response = userService.getPendingUsers(userId, page, size);
    return ApiResponse.success("체육관 대기 회원 조회 완료", response);
  }

  @PatchMapping("/assign-user/{targetUserId}")
  public ApiResponse<Void> assignUser(
          @AuthenticationUserId Long ownerUserId,
          @PathVariable Long targetUserId
  ) {
    userService.assignUser(ownerUserId, targetUserId);
    return ApiResponse.success("회원 승인 성공", null);
  }
}
