package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    @Test
    void generatedTokenCanBeValidatedAndParsed() {
        JwtService jwtService = new JwtService("01234567890123456789012345678901", 60_000, new MockEnvironment());

        String token = jwtService.generateToken(TestData.uuid(1), "user@example.test");

        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(TestData.uuid(1));
    }

    @Test
    void rejectsMissingSecret() {
        assertThatThrownBy(() -> new JwtService(" ", 60_000, new MockEnvironment()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT_SECRET must be configured for the active Spring profile");
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtService("short", 60_000, new MockEnvironment()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT_SECRET must be at least 32 bytes for HS256 signing");
    }

    @Test
    void acceptsLocalOnlyDefaultSecretForLocalProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");

        assertThat(new JwtService("local-development-jwt-secret-change-before-nonlocal-use", 60_000, environment))
                .isNotNull();
    }

    @Test
    void rejectsLocalOnlyDefaultSecretForDevProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("dev");

        assertThatThrownBy(() -> new JwtService("local-development-jwt-secret-change-before-nonlocal-use", 60_000, environment))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT_SECRET must be a non-default secret for dev/prod profiles");
    }

    @Test
    void rejectsPlaceholderSecretForProdProfile() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");

        assertThatThrownBy(() -> new JwtService("change_this_jwt_secret_value_123456789", 60_000, environment))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT_SECRET must be a non-default secret for dev/prod profiles");
    }
}
