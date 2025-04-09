package bon.bon_jujitsu.controller;

import bon.bon_jujitsu.dto.common.ApiResponse;
import bon.bon_jujitsu.dto.request.LoginRequest;
import bon.bon_jujitsu.dto.request.LogoutRequest;
import bon.bon_jujitsu.dto.request.ProfileDeleteRequest;
import bon.bon_jujitsu.dto.request.RefreshTokenRequest;
import bon.bon_jujitsu.dto.request.SignupRequest;
import bon.bon_jujitsu.dto.response.LoginResponse;
import bon.bon_jujitsu.dto.response.LogoutResponse;
import bon.bon_jujitsu.dto.response.RefreshTokenResponse;
import bon.bon_jujitsu.dto.response.UserResponse;
import bon.bon_jujitsu.dto.update.ProfileUpdateRequest;
import bon.bon_jujitsu.jwt.JwtUtil;
import bon.bon_jujitsu.resolver.AuthenticationUserId;
import bon.bon_jujitsu.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/users")
public class UserController {

  private final UserService usersService;

  @PostMapping("/signup")
  public ApiResponse<Void> signup(
          @RequestPart("request") @Valid SignupRequest request,
          @RequestPart(value = "images", required = false) List<MultipartFile> images) {
    usersService.signup(request, images);
    return ApiResponse.success("회원 가입 완료", null);
  }

  @PostMapping("/login")
  public ApiResponse<LoginResponse> login(
      @Valid @RequestBody LoginRequest req
  ) {
    LoginResponse response = usersService.login(req);
    return ApiResponse.success("로그인 성공", response);
  }

  @PostMapping("/logout")
  public ApiResponse<LogoutResponse> logout(
      @RequestHeader("Authorization") String authorizationHeader
  ) {
    String accessToken = extractAccessToken(authorizationHeader);
    LogoutResponse response = usersService.logout(accessToken);
    return ApiResponse.success("로그아웃 성공", response);
  }

  // AccessToken 추출 메서드
  private String extractAccessToken(String header) {
    if (header != null && header.startsWith("Bearer ")) {
      return header.substring(7);
    }
    throw new IllegalArgumentException("잘못된 Authorization 헤더입니다.");
  }

  @PostMapping("/refresh")
  public ApiResponse<RefreshTokenResponse> refreshToken(@RequestBody RefreshTokenRequest request) {
    String newAccessToken = usersService.refreshAccessToken(request.refreshToken());
    RefreshTokenResponse response = new RefreshTokenResponse(newAccessToken);
    return ApiResponse.success("Refresh Token 발급 성공", response);
  }

  @GetMapping("/profile")
  public ApiResponse<UserResponse> getProfile(@AuthenticationUserId Long userId) {
    UserResponse response = usersService.getProfile(userId);
    return ApiResponse.success("프로필 조회 성공", response);
  }

  @PatchMapping("/profile")
  public ApiResponse<Void> updateProfile(
      @AuthenticationUserId Long userId,
      @RequestPart("request") @Valid ProfileUpdateRequest request,
      @RequestPart(value = "images", required = false) List<MultipartFile> images) {
    usersService.updateProfile(userId, request, images);
    return ApiResponse.success("프로필 수정 성공", null);
  }

  @DeleteMapping("/me")
  public ApiResponse<Void> deleteProfile(
      @AuthenticationUserId Long userId,
      @RequestBody @Valid ProfileDeleteRequest request) {
    usersService.deleteUser(userId, request);
    return ApiResponse.success("프로필 삭제 성공", null);
  }


}

