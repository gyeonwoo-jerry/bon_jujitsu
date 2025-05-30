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

    // AuthenticationUserId 어노테이ション에서 required 값 가져오기
    AuthenticationUserId annotation = parameter.getParameterAnnotation(AuthenticationUserId.class);
    boolean required = annotation.required();

    // 토큰이 없는 경우 처리
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
      if (required) {
        throw new IllegalArgumentException("유효하지 않은 인증 토큰 형식입니다.");
      }
      return null; // required=false면 null 반환
    }

    try {
      final String token = authHeader.substring(7); // "Bearer " 제거
      log.debug("추출된 토큰: {}", token); // 디버깅용

      // 토큰에서 사용자 ID(Long)를 추출해서 반환
      return jwtUtil.getPayload(token);
    } catch (Exception e) {
      if (required) {
        throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
      }
      return null; // required=false면 토큰이 유효하지 않아도 null 반환
    }
  }
}