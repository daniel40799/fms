package com.fapor7.fms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;

/**
 * Serves user-uploaded public assets from the local uploads directory.
 */
@Configuration
public class StaticResourceConfig implements WebMvcConfigurer {

    private final Path uploadBasePath;

    public StaticResourceConfig(@Value("${app.upload.base-path:uploads}") String uploadBasePath) {
        this.uploadBasePath = resolveUploadBasePath(uploadBasePath);
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path profilePicturesDir = uploadBasePath.resolve("profile-pictures").toAbsolutePath().normalize();
        registry.addResourceHandler("/uploads/profile-pictures/**")
                .addResourceLocations(profilePicturesDir.toUri().toString());
    }

    private Path resolveUploadBasePath(String value) {
        if (value == null || value.isBlank()) {
            return Path.of("uploads");
        }

        return Path.of(value);
    }
}
