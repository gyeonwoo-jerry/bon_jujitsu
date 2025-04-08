package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.domain.UserRole;
import bon.bon_jujitsu.dto.request.UserRoleRequest;
import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.common.PageResponse;
import bon.bon_jujitsu.dto.request.GetAllUserRequest;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

  private final UserService userService;

  @PostMapping("/assignRole")
  public ApiResponse<Void> assignRole(
          @AuthenticationUserId Long loggedInUserId,
          @RequestBody @Valid UserRoleRequest request
  ) {
    userService.assignRole(loggedInUserId, request);
    return ApiResponse.success("역할 변경 완료", null);
  }

  @GetMapping("/users")
  public ApiResponse<PageResponse<UserResponse>> getAllUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size,
      @RequestParam(required = false) String name,
      @RequestParam(required = false) UserRole role,
      @RequestParam(required = false) Long branchId
  ) {
    GetAllUserRequest request = new GetAllUserRequest(name, role, branchId);
    PageResponse<UserResponse> response = userService.getUsers(page, size, userId, request);
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
}
