package bon.bon_jujitsu.resolver;

import bon.bon_jujitsu.jwt.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

@Component
@RequiredArgsConstructor
@Slf4j
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

  private final JwtUtil jwtUtil;

  @Override
  public boolean supportsParameter(MethodParameter parameter) {
    return parameter.getParameterAnnotation(AuthenticationUserId.class) != null
        && parameter.getParameterType().equals(Long.class);
  }

  @Override
  public Object resolveArgument(
      MethodParameter parameter, ModelAndViewContainer mavContainer,
      NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {

    final HttpServletRequest httpServletRequest = webRequest.getNativeRequest(HttpServletRequest.class);
    final String authHeader = Objects.requireNonNull(httpServletRequest).getHeader(HttpHeaders.AUTHORIZATION);

    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      throw new IllegalArgumentException("유효하지 않은 인증 토큰 형식입니다.");
    }

    final String token = authHeader.substring(7); // "Bearer " 제거
    log.debug("추출된 토큰: {}", token); // 디버깅용

    // 토큰에서 사용자 ID(Long)를 추출해서 반환
    return jwtUtil.getPayload(token);
  }
}