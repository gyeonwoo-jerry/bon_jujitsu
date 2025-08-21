package bon.bon_jujitsu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.resource.PathResourceResolver;
import org.springframework.beans.factory.annotation.Value;

@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Value("${filepath}")
  private String filepath;

  @Override
  public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:3000",
            "https://bon-dev.ezylab.co.kr")
        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
        .allowedHeaders("*")
        .allowCredentials(true);
  }

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // ✅ 1순위: 기존 첨부파일
    registry.addResourceHandler("/data/uploads/**")
        .addResourceLocations("file:/data/uploads/")
        .setCachePeriod(3600);

    // ✅ 2순위: CKEditor 이미지
    registry.addResourceHandler("/uploads/editor/images/**")
        .addResourceLocations("file:" + filepath + "editor/images/")
        .setCachePeriod(3600);

    // ✅ 마지막: API 제외하고 SPA 처리 (강력한 버전)
    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected org.springframework.core.io.Resource getResource(String resourcePath,
              org.springframework.core.io.Resource location) throws java.io.IOException {

            // ✅ 강력한 API 제외 로직
            if (resourcePath.startsWith("api") ||
                resourcePath.startsWith("api/") ||
                resourcePath.contains("/api/")) {
              return null; // API는 절대 처리하지 않음
            }

            // ✅ 파일 요청도 제외
            if (resourcePath.startsWith("data/") ||
                resourcePath.startsWith("uploads/")) {
              return null;
            }

            org.springframework.core.io.Resource requestedResource = location.createRelative(resourcePath);

            // 실제 파일이 존재하면 반환
            if (requestedResource.exists() && requestedResource.isReadable()) {
              return requestedResource;
            }

            // React SPA: index.html 반환
            return new org.springframework.core.io.ClassPathResource("/static/index.html");
          }
        });
  }
}