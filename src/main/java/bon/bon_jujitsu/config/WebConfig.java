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
    // ✅ 1순위: 기존 첨부파일
    registry.addResourceHandler("/data/uploads/**")
        .addResourceLocations("file:/data/uploads/")
        .setCachePeriod(3600)
        .resourceChain(true)
        .addResolver(new PathResourceResolver());

    // ✅ 2순위: CKEditor 이미지 (나중을 위해 추가)
    registry.addResourceHandler("/uploads/editor/images/**")
        .addResourceLocations("file:" + filepath + "editor/images/")
        .setCachePeriod(3600)
        .resourceChain(true)
        .addResolver(new PathResourceResolver());

    // ✅ 3순위: React SPA (API 제외하고 처리)
    registry.addResourceHandler("/**")
        .addResourceLocations("classpath:/static/")
        .resourceChain(true)
        .addResolver(new PathResourceResolver() {
          @Override
          protected Resource getResource(String resourcePath, Resource location) throws IOException {
            // ✅ 핵심: API 요청은 절대 처리하지 않음
            if (resourcePath.startsWith("api/")) {
              return null; // 컨트롤러가 처리하도록
            }

            // ✅ 파일 요청도 다른 핸들러가 처리하도록
            if (resourcePath.startsWith("data/") ||
                resourcePath.startsWith("uploads/")) {
              return null;
            }

            Resource requestedResource = location.createRelative(resourcePath);

            // 실제 파일이 존재하면 반환
            if (requestedResource.exists() && requestedResource.isReadable()) {
              return requestedResource;
            }

            // React SPA: 모든 페이지 요청을 index.html로
            return new ClassPathResource("/static/index.html");
          }
        });
  }
}