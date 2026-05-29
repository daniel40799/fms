package com.fapor7.fms.config;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Fails fast when the production profile is started with unsafe environment settings.
 */
@Component
@Profile("prod")
public class ProdEnvironmentValidator implements ApplicationRunner {

    private static final String LOCAL_JWT_SECRET = "local-development-jwt-secret-change-before-nonlocal-use";

    private final String datasourceUrl;
    private final String jwtSecret;
    private final String corsAllowedOrigins;
    private final String uploadBasePath;
    private final boolean showSql;
    private final boolean logTwoFactorCodes;

    public ProdEnvironmentValidator(
            @Value("${spring.datasource.url:}") String datasourceUrl,
            @Value("${app.jwt.secret:}") String jwtSecret,
            @Value("${app.cors.allowed-origins:}") String corsAllowedOrigins,
            @Value("${app.upload.base-path:}") String uploadBasePath,
            @Value("${spring.jpa.show-sql:false}") boolean showSql,
            @Value("${app.two-factor.email.log-codes:false}") boolean logTwoFactorCodes
    ) {
        this.datasourceUrl = datasourceUrl;
        this.jwtSecret = jwtSecret;
        this.corsAllowedOrigins = corsAllowedOrigins;
        this.uploadBasePath = uploadBasePath;
        this.showSql = showSql;
        this.logTwoFactorCodes = logTwoFactorCodes;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> errors = new ArrayList<>();

        if (isBlank(jwtSecret) || LOCAL_JWT_SECRET.equals(jwtSecret) || jwtSecret.toLowerCase(Locale.ROOT).contains("change_this")) {
            errors.add("JWT_SECRET must be a non-default production secret");
        }

        if (isBlank(datasourceUrl)) {
            errors.add("DB_URL must be configured for prod");
        } else if (containsLocalHost(datasourceUrl)) {
            errors.add("DB_URL must not point to localhost or a loopback host in prod");
        }

        if (isPostgresqlUrl(datasourceUrl) && !datasourceUrl.toLowerCase(Locale.ROOT).contains("sslmode=require")) {
            errors.add("DB_URL must be an Azure PostgreSQL JDBC URL containing sslmode=require");
        }

        List<String> corsOrigins = csv(corsAllowedOrigins);
        if (corsOrigins.isEmpty() || corsOrigins.contains("*")) {
            errors.add("CORS_ALLOWED_ORIGINS must list explicit production frontend origins");
        }
        for (String origin : corsOrigins) {
            validateCorsOrigin(origin, errors);
        }

        if (hasUnsafeUploadBasePath(uploadBasePath)) {
            errors.add("APP_UPLOAD_BASE_PATH must not use default, source-tree, or temp upload paths in prod");
        }

        if (showSql) {
            errors.add("spring.jpa.show-sql must remain disabled in prod");
        }

        if (logTwoFactorCodes) {
            errors.add("2FA verification code logging must remain disabled in prod");
        }

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Unsafe prod environment configuration: " + String.join("; ", errors));
        }
    }

    private List<String> csv(String value) {
        if (isBlank(value)) {
            return List.of();
        }

        return Arrays.stream(value.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isBlank())
                .toList();
    }

    private void validateCorsOrigin(String origin, List<String> errors) {
        if ("*".equals(origin)) {
            return;
        }

        URI uri;
        try {
            uri = new URI(origin);
        } catch (URISyntaxException exception) {
            errors.add("CORS origin is not a valid URI: " + origin);
            return;
        }

        String scheme = uri.getScheme();
        String host = uri.getHost();
        if (!"https".equalsIgnoreCase(scheme)) {
            errors.add("CORS origin must use HTTPS in prod: " + origin);
        }
        if (isBlank(host)) {
            errors.add("CORS origin must include an explicit host: " + origin);
        } else if (isLocalHost(host)) {
            errors.add("CORS origin must not point to localhost or a loopback host in prod: " + origin);
        }
    }

    private boolean isPostgresqlUrl(String value) {
        return value != null && value.toLowerCase(Locale.ROOT).startsWith("jdbc:postgresql:");
    }

    private boolean containsLocalHost(String value) {
        if (value == null) {
            return false;
        }

        String normalized = value.toLowerCase(Locale.ROOT);
        return normalized.contains("localhost")
                || normalized.contains("127.0.0.1")
                || normalized.contains("0.0.0.0")
                || normalized.contains("::1")
                || normalized.contains("host.docker.internal");
    }

    private boolean isLocalHost(String host) {
        String normalized = host.toLowerCase(Locale.ROOT);
        return normalized.equals("localhost")
                || normalized.equals("127.0.0.1")
                || normalized.equals("0.0.0.0")
                || normalized.equals("::1")
                || normalized.equals("[::1]")
                || normalized.equals("host.docker.internal");
    }

    private boolean hasUnsafeUploadBasePath(String value) {
        if (isBlank(value)) {
            return true;
        }

        String normalized = value.trim()
                .replace('\\', '/')
                .replaceAll("/+", "/")
                .toLowerCase(Locale.ROOT);

        return normalized.equals("uploads")
                || normalized.equals("./uploads")
                || normalized.equals("backend/uploads")
                || normalized.equals("./backend/uploads")
                || normalized.equals("src/main/resources")
                || normalized.startsWith("src/main/resources/")
                || normalized.endsWith("/src/main/resources")
                || normalized.contains("/src/main/resources/")
                || normalized.equals("tmp")
                || normalized.equals("temp")
                || normalized.startsWith("tmp/")
                || normalized.startsWith("temp/")
                || normalized.endsWith("/tmp")
                || normalized.endsWith("/temp")
                || normalized.contains("/tmp/")
                || normalized.contains("/temp/");
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
