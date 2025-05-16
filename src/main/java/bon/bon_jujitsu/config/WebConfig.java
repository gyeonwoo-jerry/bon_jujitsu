package bon.bon_jujitsu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.servlet.resource.PathResourceResolver;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${filepath}")
  private String filepath;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins(
            "http://localhost:3000",
            "http://localhost:8080",
            "http://211.110.44.79:58000", // 서버 자체 주소
            "http://211.110.44.79", // 포트 없는 서버 주소
            "https://211.110.44.79", // HTTPS 버전
            "*" // 모든 출처 허용 (개발 중에만 사용하고 프로덕션에서는 제거하세요)
        )
        .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        .allowedHeaders("*")
        .exposedHeaders("Authorization", "Content-Type")
        .allowCredentials(true)
        .maxAge(3600); // 프리플라이트 요청 캐싱 시간 (1시간)
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // 업로드된 파일을 위한 정적 리소스 핸들러 추가
    registry.addResourceHandler("/uploads/**")
        .addResourceLocations("file:/uploads/")
        .setCachePeriod(3600) // 캐시 설정 (선택 사항)
        .resourceChain(true)
        .addResolver(new PathResourceResolver());

    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            Resource requestedResource = location.createRelative(resourcePath);
            return requestedResource.exists() && requestedResource.isReadable() ? requestedResource
                : new ClassPathResource("/static/index.html");
          }
        });
  }
}