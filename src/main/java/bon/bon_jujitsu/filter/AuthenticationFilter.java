package bon.bon_jujitsu.filter;

import bon.bon_jujitsu.jwt.JwtUtil;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements Filter {

  private final JwtUtil jwtUtil;
  @Value("${spring.profiles.active}")
  private String activeProfile;  // 현재 활성화된 프로파일을 가져옵니다.

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest req = (HttpServletRequest) request;
    HttpServletResponse res = (HttpServletResponse) response;

    final String authorizationHeader = req.getHeader(HttpHeaders.AUTHORIZATION);
    final String requestUri = req.getRequestURI();
    final String httpMethod = req.getMethod(); // HTTP 메서드 확인

    System.out.println("Request URI: " + requestUri + ", Method: " + httpMethod);
    boolean isDevelopment = "dev".equalsIgnoreCase(activeProfile);  // 프로파일이 'dev'일 때 true

    // 인증이 필요 없는 경로 설정
    if (
        requestUri.contains("/api/users/signup") ||
            requestUri.contains("/api/users/login") ||
            requestUri.contains("/api/users/check-member-id") ||
            requestUri.matches("/api/admin/\\d+") ||
            requestUri.contains("/v3/api-docs") ||
            requestUri.contains("/swagger-ui") ||
            requestUri.contains("/swagger-resources") ||
            requestUri.startsWith("/static") ||
            requestUri.startsWith("/images") ||
            requestUri.equals("/asset-manifest.json") ||
            requestUri.equals("/favicon.ico") ||
            requestUri.equals("/manifest.json") ||
            requestUri.equals("/logo192.png") ||
            requestUri.equals("/logo512.png") ||
            requestUri.equals("/robots.txt") ||
            requestUri.equals("/") ||
            requestUri.startsWith("/academy") ||
            requestUri.startsWith("/branches") ||
            requestUri.startsWith("/branches/:id") ||
            requestUri.startsWith("/comunity") ||
            requestUri.startsWith("/store") ||
            requestUri.startsWith("/skill") ||
            requestUri.startsWith("/news") ||
            requestUri.startsWith("/newsDetail/:id") ||
            requestUri.startsWith("/newsWrite") ||
            requestUri.startsWith("/qna") ||
            requestUri.startsWith("/sponsor") ||
            requestUri.startsWith("/join") ||
            requestUri.startsWith("/introGreeting") ||
            requestUri.startsWith("/introJiujitsu") ||
            requestUri.startsWith("/introLevel") ||
            requestUri.startsWith("/storeDetail") ||
            requestUri.startsWith("/cart") ||
            requestUri.startsWith("/order") ||
            requestUri.startsWith("/storeWrite") ||
            requestUri.startsWith("/uploads/images/") || // 이미지 업로드 경로 예외 처리
            requestUri.startsWith("/api/qna") ||
            (isDevelopment && "OPTIONS".equalsIgnoreCase(httpMethod)) || // OPTIONS 메서드 추가
            (requestUri.startsWith("/api/board") && (isDevelopment || "GET".equalsIgnoreCase(
                httpMethod))) || //  GET /api/board 예외 처리 추가
            (requestUri.startsWith("/api/branch") && (isDevelopment || "GET".equalsIgnoreCase(
                httpMethod))) || //  GET /api/branch 예외 처리 추가
            (requestUri.startsWith("/api/notice") && (isDevelopment || "GET".equalsIgnoreCase(
                httpMethod))) || //  GET /api/notice 예외 처리 추가
            (requestUri.startsWith("/api/news") && (isDevelopment || "GET".equalsIgnoreCase(
                httpMethod))) || //  GET /api/notice 예외 처리 추가
            (requestUri.startsWith("/api/skill") && (isDevelopment || "GET".equalsIgnoreCase(
                httpMethod))) || //  GET /api/skill 예외 처리 추가
            (requestUri.startsWith("/api/sponsor") && (isDevelopment || "GET".equalsIgnoreCase(
                httpMethod))) //  GET /api/sponsor 예외 처리 추가
    ) {
      System.out.println("Skipping authentication for: " + requestUri + ", Method: " + httpMethod);
      chain.doFilter(request, response);
      return;
    }

    // 인증 헤더 확인
    if (Objects.isNull(authorizationHeader)) {

      log.error("1. 인증헤더 없음.");

      // throw new IllegalArgumentException("로그인 후 이용가능 합니다.");
      res.setStatus(HttpStatus.UNAUTHORIZED.value()); // 상태 코드 설정
      res.setContentType("application/json"); // JSON 응답
      res.getWriter()
          .write("{\"success\": \"false\", \"message\": \"로그인 후 이용 가능합니다.\", \"status\": 401}");
      return;
    }

    // Bearer 접두사 확인 및 제거
    if (!authorizationHeader.startsWith("Bearer ")) {
      log.error("2. 유효하지 않은 토큰 형식입니다.");
      throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
    }

    String token = authorizationHeader.substring(7); // "Bearer " 제거
    System.out.println("추출된 토큰: " + token); // 디버깅용

    if (token.equals("null") || token.equals("undefined")) {
      log.error("3. 토큰이 없습니다.");
      // throw new IllegalArgumentException("로그인 후 이용가능 합니다.");
      res.setStatus(HttpStatus.UNAUTHORIZED.value()); // 상태 코드 설정
      res.setContentType("application/json"); // JSON 응답
      res.getWriter()
          .write("{\"success\": \"false\", \"message\": \"로그인 후 이용 가능합니다.\", \"status\": 401}");
      return;
    }

    // 토큰 만료 체크 (순서 중요: Bearer 제거 후)
    if (jwtUtil.isTokenExpired(token)) {
      log.error("4. 토큰이 만료되었습니다.");
      // throw new IllegalArgumentException("로그인 시간이 만료되었습니다.");
      res.setStatus(HttpStatus.UNAUTHORIZED.value()); // 상태 코드 설정
      res.setContentType("application/json"); // JSON 응답
      res.getWriter()
          .write("{\"success\": \"false\", \"message\": \"로그인 시간이 만료되었습니다.\", \"status\": 401}");
      return;
    }
    try {
      // 기존 인증 로직
      chain.doFilter(request, response);
    } catch (IllegalArgumentException e) {
      log.error("5. 인증 오류 발생: {}", e.getMessage());
      res.setStatus(HttpStatus.UNAUTHORIZED.value());
      res.setContentType("application/json");
      res.getWriter().write(
          "{\"error\": \"" + e.getMessage() + "\", \"status\": 401}"
      );
    }
  }
}

