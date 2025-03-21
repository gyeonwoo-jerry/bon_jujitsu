package bon.bon_jujitsu.filter;

import bon.bon_jujitsu.jwt.JwtUtil;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthenticationFilter implements Filter {

  private final JwtUtil jwtUtil;

  @Override
  public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
      throws IOException, ServletException {
    HttpServletRequest req = (HttpServletRequest) request;

    final String authorizationHeader = req.getHeader(HttpHeaders.AUTHORIZATION);
    final String requestUri = req.getRequestURI();
    final String httpMethod = req.getMethod(); // HTTP 메서드 확인

    System.out.println("Request URI: " + requestUri + ", Method: " + httpMethod);

    // 인증이 필요 없는 경로 설정
    if (
        requestUri.contains("/api/users/signup") ||
            requestUri.contains("/api/users/login") ||
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
            (requestUri.startsWith("/api/board") && "GET".equalsIgnoreCase(httpMethod)) || //  GET /api/board 예외 처리 추가
            (requestUri.startsWith("/api/branch") && "GET".equalsIgnoreCase(httpMethod)) || //  GET /api/branch 예외 처리 추가
            (requestUri.startsWith("/api/notice") && "GET".equalsIgnoreCase(httpMethod)) || //  GET /api/notice 예외 처리 추가
            (requestUri.startsWith("/api/news") && "GET".equalsIgnoreCase(httpMethod)) || //  GET /api/notice 예외 처리 추가
            (requestUri.startsWith("/api/skill") && "GET".equalsIgnoreCase(httpMethod)) || //  GET /api/skill 예외 처리 추가
            (requestUri.startsWith("/api/sponsor") && "GET".equalsIgnoreCase(httpMethod)) //  GET /api/sponsor 예외 처리 추가

    ) {
      System.out.println("Skipping authentication for: " + requestUri + ", Method: " + httpMethod);
      chain.doFilter(request, response);
      return;
    }

    // 인증 헤더 확인
    if (Objects.isNull(authorizationHeader)) {
      throw new IllegalArgumentException("접근 토큰이 없습니다.");
    }

    // Bearer 접두사 확인 및 제거
    if (!authorizationHeader.startsWith("Bearer ")) {
      throw new IllegalArgumentException("유효하지 않은 토큰 형식입니다.");
    }

    String token = authorizationHeader.substring(7); // "Bearer " 제거
    System.out.println("추출된 토큰: " + token); // 디버깅용

    // 토큰 만료 체크 (순서 중요: Bearer 제거 후)
    if (jwtUtil.isTokenExpired(token)) {
      throw new IllegalArgumentException("토큰이 만료되었습니다.");
    }

    chain.doFilter(request, response);
  }
}

