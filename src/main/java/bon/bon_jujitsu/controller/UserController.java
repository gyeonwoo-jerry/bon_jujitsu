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
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

  private final UserService usersService;

  @PostMapping("/signup")
  public ResponseEntity<String> signup(
          @RequestPart("request") @Valid SignupRequest req,
          @RequestPart(value = "images", required = false) List<MultipartFile> images) {
    usersService.signup(req, images);
    return ResponseEntity.status(HttpStatus.CREATED).body("회원가입이 정상적으로 처리되었습니다.");
  }

  @PostMapping("/login")
  public ResponseEntity<String> login(@Valid @RequestBody LoginRequest req) {
    return ResponseEntity.status(HttpStatus.CREATED).body(usersService.login(req));
  }

  @GetMapping("/profile")
  public ResponseEntity<UserResponse> getProfile(@AuthenticationUserId Long userId) {
    UserResponse response = usersService.getProfile(userId);
    return ResponseEntity.status(HttpStatus.OK).body(response);
  }

  @PatchMapping("/profile")
  public ResponseEntity<Void> updateProfile(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid ProfileUpdateRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images) {
    usersService.updateProfile(userId, request, images);
    return ResponseEntity.status(HttpStatus.OK).build();
  }

  @DeleteMapping("/me")
  public ResponseEntity<Void> deleteProfile(
      @AuthenticationUserId Long userId,
      @RequestBody @Valid ProfileDeleteRequest request) {
    usersService.deleteUser(userId, request);
    return ResponseEntity.status(HttpStatus.OK).build();
  }
}

