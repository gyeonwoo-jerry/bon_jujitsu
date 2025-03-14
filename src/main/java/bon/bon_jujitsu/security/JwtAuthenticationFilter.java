//package bon.bon_jujitsu.security;
//
//import bon.bon_jujitsu.domain.UserRole;
//import bon.bon_jujitsu.dto.request.LoginRequest;
//import bon.bon_jujitsu.dto.response.TokenResponse;
//import bon.bon_jujitsu.jwt.JwtUtil;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import java.io.IOException;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.AuthenticationException;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//
//@Slf4j(topic = "로그인 및 JWT 생성")
//public class JwtAuthenticationFilter extends UsernamePasswordAuthenticationFilter {
//  private final JwtUtil jwtUtil;
//
//  public JwtAuthenticationFilter(JwtUtil jwtUtil) {
//    this.jwtUtil = jwtUtil;
//    setFilterProcessesUrl("/api/user/login");
//  }
//
//  @Override
//  public Authentication attemptAuthentication(
//      HttpServletRequest request, HttpServletResponse response) throws AuthenticationException {
//    try {
//      LoginRequest requestDto = new ObjectMapper().readValue(request.getInputStream(), LoginRequest.class);
//
//      return getAuthenticationManager().authenticate(
//          new UsernamePasswordAuthenticationToken(
//              requestDto.nickname(),
//              requestDto.password(),
//              null
//          )
//      );
//    } catch (IOException e) {
//      log.error(e.getMessage());
//      throw new RuntimeException(e.getMessage());
//    }
//  }
//
//  @Override
//  protected void successfulAuthentication(HttpServletRequest request, HttpServletResponse response, FilterChain chain, Authentication authResult) {
//    String nickname = ((UserDetailsImpl) authResult.getPrincipal()).getUsername();
//    UserRole role = ((UserDetailsImpl) authResult.getPrincipal()).getUser().getUserRole();
//
//    TokenResponse tokenResponse = jwtUtil.createTokens(nickname, role);
//    response.addHeader(JwtUtil.AUTHORIZATION_HEADER, tokenResponse.accessToken());
//    response.addHeader("Refresh-Token", tokenResponse.refreshToken());
//  }
//
//  @Override
//  protected void unsuccessfulAuthentication(HttpServletRequest request, HttpServletResponse response, AuthenticationException failed) {
//    response.setStatus(401);
//  }
//
//}
