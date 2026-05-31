package com.fapor7.fms.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Date;
import java.util.UUID;

/**
 * Creates and validates JSON Web Tokens for stateless API authentication.
 *
 * <p>Tokens store the user UUID as the subject and the user's email as a claim.
 * Expiration and signing secret are read from application configuration.</p>
 */
@Service
public class JwtService {

    private static final String LOCAL_DEVELOPMENT_SECRET = "local-development-jwt-secret-change-before-nonlocal-use";

    private final SecretKey secretKey;
    private final long expirationMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs,
            Environment environment
    ) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured for the active Spring profile");
        }

        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 bytes for HS256 signing");
        }

        if (usesStrictSecretProfile(environment) && isUnsafeNonLocalSecret(secret)) {
            throw new IllegalStateException("JWT_SECRET must be a non-default secret for dev/prod profiles");
        }

        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    /**
     * Generates a signed token for an authenticated user.
     *
     * @param userId authenticated user's unique id
     * @param email authenticated user's email address
     * @return compact signed JWT string
     */
    public String generateToken(UUID userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(secretKey)
                .compact();
    }

    /**
     * Reads the user id from a token subject.
     *
     * @param token signed JWT
     * @return user UUID embedded in the token
     */
    public UUID extractUserId(String token) {
        return UUID.fromString(getClaims(token).getSubject());
    }

    /**
     * Checks whether the token is parseable, signed correctly, and not expired.
     *
     * @param token signed JWT
     * @return {@code true} when the token expiration is still in the future
     */
    public boolean isTokenValid(String token) {
        return getClaims(token).getExpiration().after(new Date());
    }

    /**
     * Parses token claims after verifying the signature.
     *
     * @param token signed JWT
     * @return verified token claims
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean usesStrictSecretProfile(Environment environment) {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "dev".equals(profile) || "prod".equals(profile));
    }

    private boolean isUnsafeNonLocalSecret(String secret) {
        String normalized = secret.toLowerCase(Locale.ROOT);
        return LOCAL_DEVELOPMENT_SECRET.equals(secret)
                || normalized.contains("change_this")
                || normalized.contains("change-before-nonlocal-use");
    }
}
