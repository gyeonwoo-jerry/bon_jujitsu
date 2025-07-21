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
        .allowedOrigins("http://localhost:3000")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        .allowedHeaders("*")
        .allowCredentials(true);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // ✅ 1순위: 기존 첨부파일 경로
    registry.addResourceHandler("/data/uploads/**")
        .addResourceLocations("file:/data/uploads/")
        .setCachePeriod(3600)
        .resourceChain(true)
        .addResolver(new PathResourceResolver());

    // ✅ 2순위: CKEditor 이미지 경로
    registry.addResourceHandler("/uploads/editor/images/**")
        .addResourceLocations("file:" + filepath + "editor/images/")
        .setCachePeriod(3600)
        .resourceChain(true)
        .addResolver(new PathResourceResolver());

    // ✅ 3순위: 정적 리소스 (CSS, JS, 이미지 등)
    registry.addResourceHandler("/static/**")
        .addResourceLocations("classpath:/static/")
        .setCachePeriod(3600);

    // ✅ 마지막: React SPA 라우팅 (API, 파일 경로 제외)
    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            // API 요청이나 파일 요청은 제외
            if (resourcePath.startsWith("api/") ||
                resourcePath.startsWith("data/") ||
                resourcePath.startsWith("uploads/")) {
              return null; // 다른 핸들러가 처리하도록
            }

            Resource requestedResource = location.createRelative(resourcePath);
            return requestedResource.exists() && requestedResource.isReadable() ? requestedResource
                : new ClassPathResource("/static/index.html");
          }
        });
  }
}