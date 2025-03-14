package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.request.LoginRequest;
import bon.bon_jujitsu.dto.request.ProfileDeleteRequest;
import bon.bon_jujitsu.dto.request.SignupRequest;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

  private final UserService usersService;

  @PostMapping("/signup")
  public ResponseEntity<String> signup(@Valid @RequestBody SignupRequest req) {
    usersService.signup(req);
    return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 정상적으로 처리되었습니다.");
  }

  @PostMapping("/login")
  public ResponseEntity<String> login(@Valid @RequestBody LoginRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(usersService.login(req));
  }

  @GetMapping("/profile")
  public ResponseEntity<UserResponse> getProfile(@AuthenticationUserId Long id) {
    UserResponse response = usersService.getProfile(id);
    return ResponseEntity.status(HttpStatus.OK).body(response);
  }

  @PatchMapping("/profile")
  public ResponseEntity<Void> updateProfile(
      @AuthenticationUserId Long id,
      @RequestBody @Valid ProfileUpdateRequest request) {
    usersService.updateProfile(id, request);
    return ResponseEntity.status(HttpStatus.OK).build();
  }

  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteProfile(
      @AuthenticationUserId Long id,
      @RequestBody @Valid ProfileDeleteRequest request) {
    usersService.deleteUser(id, request);
    return ResponseEntity.status(HttpStatus.OK).build();
  }
}

