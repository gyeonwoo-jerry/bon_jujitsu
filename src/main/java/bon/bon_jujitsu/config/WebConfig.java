package bon.bon_jujitsu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;  
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.web.servlet.resource.PathResourceResolver;
import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
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
    // @Override
    // public void addResourceHandlers(ResourceHandlerRegistry registry) {
    //     // static 리소스 처리
    //     registry.addResourceHandler("/static/**")
    //             .addResourceLocations("classpath:/static/");
    // }
    
    // @Override
    // public void addViewControllers(ViewControllerRegistry registry) {
    //     // /api 경로는 제외하고, /index.html 또는 다른 경로는 모두 index.html로 포워딩
    //     registry.addViewController("/{x:^(?!api$|static$|index.html).*}")
    //            .setViewName("forward:/index.html");
    
    //     // ** 경로에 대해서도 같은 방식으로 처리
    //     registry.addViewController("/**/{x:^(?!api$|static$|index.html).*}")
    //            .setViewName("forward:/index.html");
    // }
}

