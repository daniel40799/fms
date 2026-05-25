package com.fapor7.fms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Serves user-uploaded public assets from the local uploads directory.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path profilePicturesDir = Path.of("uploads", "profile-pictures").toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/profile-pictures/**")
                .addResourceLocations(profilePicturesDir.toUri().toString());
    }
}
