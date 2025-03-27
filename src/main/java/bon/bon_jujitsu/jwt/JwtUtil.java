package bon.bon_jujitsu.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jws;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.util.Date;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j(topic = "JwtUtil")
@Component
@RequiredArgsConstructor
public class JwtUtil {

  private final SecretKey secretKey;

  public JwtUtil() {
    this.secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);
  }

  public String createToken(Long userId) {
    final Date now = new Date();
    final Claims claims = Jwts.claims().setSubject(String.valueOf(userId));
    return Jwts.builder()
        .setClaims(claims)
        .setIssuedAt(now)
        .setExpiration(new Date(now.getTime() + (60 * 60 * 6 * 1000L)))
        .signWith(SignatureAlgorithm.HS256, secretKey.getEncoded())
        .compact();
  }

  public Long getPayload(final String token) {
    String subject = getClaims(token)
        .getBody()
        .getSubject();
    return Long.parseLong(subject);
  }

  public Jws<Claims> getClaims(final String token) {
    try {
      return Jwts.parserBuilder()
          .setSigningKey(secretKey.getEncoded())
          .build()
          .parseClaimsJws(token);
    } catch (Exception e) {
      throw new IllegalArgumentException(e);
    }
  }

  public Claims parseToken(final String token) {
    return Jwts.parser()
        .setSigningKey(secretKey.getEncoded())
        .parseClaimsJws(token)
        .getBody();
  }

  public boolean isTokenExpired(final String token) {
    return parseToken(token).getExpiration().before(new Date());
  }
}