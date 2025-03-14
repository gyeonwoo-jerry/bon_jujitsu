package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ListResponse;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/owners")
@RequiredArgsConstructor
public class OwnerController {

  private final UserService userService;

  @GetMapping("/users")
  public ResponseEntity<ListResponse<UserResponse>> getMyUsers(
      @AuthenticationUserId Long id,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "10") int size
  ) {
    ListResponse<UserResponse> response = userService.getMyUsers(id, page, size);
    return ResponseEntity.ok(response);
  }

}
