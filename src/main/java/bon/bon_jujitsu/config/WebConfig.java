package bon.bon_jujitsu.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;

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

    // @Override
    // public void addResourceHandlers(ResourceHandlerRegistry registry) {
    //     registry.addResourceHandler("/static/**")
    //             .addResourceLocations("classpath:/static/");
    // }

    // @Override
    // public void addViewControllers(ViewControllerRegistry registry) {
    //     registry.addViewController("/{x:^(?!api$).*$}")
    //            .setViewName("forward:/index.html");
    //     registry.addViewController("/**/{x:^(?!api$).*$}")
    //            .setViewName("forward:/index.html");
    // }
}

