package bon.bon_jujitsu.config;

import at.favre.lib.crypto.bcrypt.BCrypt;
import org.springframework.stereotype.Component;

@Component
public class PasswordEncoder {

  public String encode(String password) {
    return BCrypt.withDefaults().hashToString(BCrypt.MIN_COST, password.toCharArray());
  }

  public boolean matches(String rawPassword, String encodedPassword) {
    BCrypt.Result result = BCrypt.verifyer().verify(rawPassword.toCharArray(), encodedPassword);
    return result.verified;
  }
}