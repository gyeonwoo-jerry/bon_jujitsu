//package bon.bon_jujitsu.security;
//
//import bon.bon_jujitsu.jwt.JwtUtil;
//import io.jsonwebtoken.Claims;
//import io.jsonwebtoken.ExpiredJwtException;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import java.io.IOException;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
//import org.springframework.security.core.Authentication;
//import org.springframework.security.core.context.SecurityContext;
//import org.springframework.security.core.context.SecurityContextHolder;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.util.StringUtils;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//@Slf4j(topic = "JWT 검증 및 인가")
//public class JwtAuthorizationFilter extends OncePerRequestFilter {
//
//  private final JwtUtil jwtUtil;
//  private final UserDetailsServiceImpl userDetailsService;
//
//  public JwtAuthorizationFilter(JwtUtil jwtUtil, UserDetailsServiceImpl userDetailsService) {
//    this.jwtUtil = jwtUtil;
//    this.userDetailsService = userDetailsService;
//  }
//
//  @Override
//  protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain filterChain) throws ServletException, IOException {
//
//    String tokenValue = jwtUtil.getJwtFromHeader(req);
//
//    if (StringUtils.hasText(tokenValue)) {
//      try {
//        if (!jwtUtil.validateToken(tokenValue)) {
//          throw new ExpiredJwtException(null, null, "Access Token expired");
//        }
//
//        Claims info = jwtUtil.getUserInfoFromToken(tokenValue);
//        setAuthentication(info.getSubject());
//      } catch (ExpiredJwtException e) {
//        // Access Token 만료 시 Refresh Token으로 새로운 Access Token 발급
//        String refreshToken = req.getHeader("Refresh-Token");
//        if (StringUtils.hasText(refreshToken)) {
//          try {
//            String newAccessToken = jwtUtil.refreshAccessToken(refreshToken);
//            res.setHeader(JwtUtil.AUTHORIZATION_HEADER, newAccessToken);
//
//            // 새 Access Token으로 인증 설정
//            Claims newInfo = jwtUtil.getUserInfoFromToken(newAccessToken.replace(JwtUtil.BEARER_PREFIX, ""));
//            setAuthentication(newInfo.getSubject());
//          } catch (Exception ex) {
//            log.error("Refresh Token invalid or expired: " + ex.getMessage());
//            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//            return;
//          }
//        } else {
//          log.error("No Refresh Token provided");
//          res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//          return;
//        }
//      } catch (Exception e) {
//        log.error("Authentication error: " + e.getMessage());
//        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//        return;
//      }
//    }
//
//    filterChain.doFilter(req, res);
//  }
//
//  // 인증 처리
//  public void setAuthentication(String nickname) {
//    SecurityContext context = SecurityContextHolder.createEmptyContext();
//    Authentication authentication = createAuthentication(nickname);
//    context.setAuthentication(authentication);
//
//    SecurityContextHolder.setContext(context);
//  }
//
//  // 인증 객체 생성
//  private Authentication createAuthentication(String nickname) {
//    UserDetails userDetails = userDetailsService.loadUserByUsername(nickname);
//    log.info("Created authentication: {}", userDetails != null ? "not null" : "null");
//    return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
//  }
//}
