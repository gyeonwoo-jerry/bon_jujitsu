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

    System.out.println("Request URI: " + requestUri);

    // 인증이 필요 없는 경로는 건너뛰기
    if ( 
        requestUri.contains("/api/users/signup") ||
        requestUri.contains("/api/users/login") ||
        requestUri.matches("/api/admin/\\d+") ||
        requestUri.contains("/v3/api-docs") ||
        requestUri.contains("/swagger-ui") ||
        requestUri.contains("/swagger-resources") ||
        requestUri.startsWith("/static") || // 정적 리소스 경로 예외 처리
        requestUri.startsWith("/images") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/asset-manifest.json") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/favicon.ico") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/manifest.json") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/logo192.png") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/logo512.png") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/robots.txt") || // 정적 리소스 경로 예외 처리
        requestUri.equals("/") // 루트 경로 예외 처리
        ) {
      System.out.println("Skipping authentication for: " + requestUri);
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

