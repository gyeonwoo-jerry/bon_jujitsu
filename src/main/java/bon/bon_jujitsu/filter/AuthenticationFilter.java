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
  @Value("${spring.profiles.active:dev}")
  private String activeProfile;

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest req = (HttpServletRequest) request;
    HttpServletResponse res = (HttpServletResponse) response;

    final String authorizationHeader = req.getHeader(HttpHeaders.AUTHORIZATION);
    final String requestUri = req.getRequestURI();
    final String httpMethod = req.getMethod();

    System.out.println("Request URI: " + requestUri + ", Method: " + httpMethod);
    boolean isDevelopment = "dev".equalsIgnoreCase(activeProfile);

    // ✅ 인증이 필요 없는 경로 설정 (App.js 라우트 기준으로 정리)
    if (
      // 정적 리소스 및 매니페스트 파일들
        requestUri.startsWith("/static") ||
            requestUri.startsWith("/images") ||
            requestUri.startsWith("/data/uploads/") ||
            requestUri.equals("/asset-manifest.json") ||
            requestUri.equals("/favicon.ico") ||
            requestUri.equals("/manifest.json") ||
            requestUri.equals("/logo192.png") ||
            requestUri.equals("/logo512.png") ||
            requestUri.equals("/robots.txt") ||

            // 메인 페이지 및 소개 페이지들
            requestUri.equals("/") ||
            requestUri.startsWith("/academy") ||
            requestUri.startsWith("/introGreeting") ||
            requestUri.startsWith("/introJiujitsu") ||
            requestUri.startsWith("/introLevel") ||

            // 지부 관련 페이지들
            requestUri.startsWith("/branches") ||

            // 상품 관련 페이지들
            requestUri.startsWith("/store") ||
            requestUri.startsWith("/storeDetail") ||
            requestUri.startsWith("/cart") ||
            requestUri.startsWith("/order") ||

            // 게시물 관련 페이지들
            requestUri.startsWith("/skill") ||
            requestUri.startsWith("/news") ||
            requestUri.startsWith("/faq") ||
            requestUri.startsWith("/sponsor") ||
            requestUri.startsWith("/write") ||
            requestUri.startsWith("/edit") ||

            // 기타 페이지들
            requestUri.startsWith("/join") ||

            // 사용자 페이지들 (클라이언트에서 권한 체크)
            requestUri.startsWith("/mypage") ||

            // 관리자 페이지들 (클라이언트에서 권한 체크)
            requestUri.startsWith("/admin") ||

            // 인증 관련 API (항상 허용)
            requestUri.contains("/api/users/signup") ||
            requestUri.contains("/api/users/login") ||
            requestUri.contains("/api/users/refresh") ||
            requestUri.contains("/api/users/check-member-id") ||

            // 공개 API들
            requestUri.startsWith("/api/comment") ||
            requestUri.startsWith("/api/qna") ||

            // 개발 도구 API
            requestUri.contains("/v3/api-docs") ||
            requestUri.contains("/swagger-ui") ||
            requestUri.contains("/swagger-resources") ||

            // 특정 패턴 (admin/{id} 형태)
            requestUri.matches("/api/admin/\\d+") ||

            // OPTIONS 메서드 (CORS preflight - 개발 환경에서만)
            (isDevelopment && "OPTIONS".equalsIgnoreCase(httpMethod)) ||

            // 개발 환경에서 GET 요청 허용 API들
            (isDevelopment && "GET".equalsIgnoreCase(httpMethod) && (
                requestUri.startsWith("/api/board") ||
                    requestUri.startsWith("/api/branch") ||
                    requestUri.startsWith("/api/notice") ||
                    requestUri.startsWith("/api/news") ||
                    requestUri.startsWith("/api/skill") ||
                    requestUri.startsWith("/api/sponsor")
            ))
    ) {
      System.out.println("Skipping authentication for: " + requestUri + ", Method: " + httpMethod);
      chain.doFilter(request, response);
      return;
    }

    // ✅ 여기서부터는 인증이 필요한 API 요청들

    // 1. 인증 헤더 확인
    if (Objects.isNull(authorizationHeader)) {
      log.error("인증헤더 없음: {} {}", httpMethod, requestUri);
      sendUnauthorizedResponse(res, "로그인 후 이용 가능합니다.");
      return;
    }

    // 2. Bearer 접두사 확인 및 제거
    if (!authorizationHeader.startsWith("Bearer ")) {
      log.error("잘못된 토큰 형식: {} {}", httpMethod, requestUri);
      sendUnauthorizedResponse(res, "유효하지 않은 토큰 형식입니다.");
      return;
    }

    String token = authorizationHeader.substring(7);
    System.out.println("추출된 토큰: " + token);

    // 3. 토큰 내용 검증
    if (token.equals("null") || token.equals("undefined") || token.trim().isEmpty()) {
      log.error("빈 토큰: {} {}", httpMethod, requestUri);
      sendUnauthorizedResponse(res, "로그인 후 이용 가능합니다.");
      return;
    }

    // 4. 토큰 만료 체크
    try {
      if (jwtUtil.isTokenExpired(token)) {
        log.error("토큰 만료: {} {}", httpMethod, requestUri);
        sendUnauthorizedResponse(res, "로그인 시간이 만료되었습니다.");
        return;
      }
    } catch (Exception e) {
      log.error("토큰 검증 실패: {} {} - {}", httpMethod, requestUri, e.getMessage());
      sendUnauthorizedResponse(res, "유효하지 않은 토큰입니다.");
      return;
    }

    // 5. 인증 성공 - 다음 필터로 진행
    try {
      chain.doFilter(request, response);
    } catch (Exception e) {
      log.error("필터 처리 중 오류: {} {} - {}", httpMethod, requestUri, e.getMessage());
      sendUnauthorizedResponse(res, "요청 처리 중 오류가 발생했습니다.");
    }
  }

  /**
   * 401 Unauthorized 응답 전송
   */
  private void sendUnauthorizedResponse(HttpServletResponse response, String message) {
    try {
      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      response.setContentType("application/json;charset=UTF-8");
      response.getWriter().write(
          String.format("{\"success\": false, \"message\": \"%s\", \"status\": 401}", message)
      );
    } catch (IOException e) {
      log.error("응답 전송 실패: {}", e.getMessage());
    }
  }
}