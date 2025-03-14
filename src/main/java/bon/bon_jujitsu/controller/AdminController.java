package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ListResponse;
import bon.bon_jujitsu.dto.common.Status;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

  private final UserService userService;

  @PostMapping("/assign-owner/{userId}")
  public ResponseEntity<Status> assignOwner(@PathVariable Long userId) {
    Status response = userService.assignOwnerRole(userId);
    return ResponseEntity.status(HttpStatus.OK).body(response);
  }

  @GetMapping("/users")
  public ResponseEntity<ListResponse<UserResponse>> getAllUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    ListResponse<UserResponse> response = userService.getUsers(page, size, userId);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/users/deleted")
  public ResponseEntity<ListResponse<UserResponse>> getDeletedUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    ListResponse<UserResponse> response = userService.getDeletedUsers(page, size, userId);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/{userId}")
  public ResponseEntity<Status> assignAdmin(@PathVariable Long userId) {
    Status response = userService.assignAdmin(userId);
    return ResponseEntity.status(HttpStatus.OK).body(response);
  }
}
