package bon.bon_jujitsu.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j(topic = "LoggingFilter")
@Component
@Order(1)
public class LoggingFilter implements Filter {
  @Override
  public void doFilter(
      ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
    // 전처리
    HttpServletRequest httpServletRequest = (HttpServletRequest) request;
    String url = httpServletRequest.getRequestURI();
    log.info(url);

    chain.doFilter(request, response); // 다음 Filter 로 이동

    // 후처리
    log.info("비즈니스 로직 완료");
  }
}
