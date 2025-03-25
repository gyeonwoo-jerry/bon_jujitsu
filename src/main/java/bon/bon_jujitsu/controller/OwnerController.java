package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ListResponse;
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
  public ResponseEntity<ListResponse<UserResponse>> getMyUsers(
      @AuthenticationUserId Long userId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    ListResponse<UserResponse> response = userService.getMyUsers(userId, page, size);
    return ResponseEntity.ok(response);
  }

  @GetMapping("/users/pending")
  public ResponseEntity<ListResponse<UserResponse>> getPendingUsers(
          @AuthenticationUserId Long userId,
          @RequestParam(defaultValue = "0") int page,
          @RequestParam(defaultValue = "10") int size
  ) {
    ListResponse<UserResponse> response = userService.getPendingUsers(userId, page, size);
    return ResponseEntity.ok(response);
  }

  @PatchMapping("/assign-user/{userId}")
  public ResponseEntity<Status> assignUser(
          @AuthenticationUserId Long ownerUserId,
          @PathVariable Long targetUserId
  ) {
    Status response = userService.assignUser(ownerUserId, targetUserId);
    return ResponseEntity.status(HttpStatus.OK).body(response);
  }
}
