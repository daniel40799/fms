package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtServiceTest {

    @Test
    void generatedTokenCanBeValidatedAndParsed() {
        JwtService jwtService = new JwtService("01234567890123456789012345678901", 60_000);

        String token = jwtService.generateToken(TestData.uuid(1), "user@example.test");

        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(TestData.uuid(1));
    }

    @Test
    void rejectsMissingSecret() {
        assertThatThrownBy(() -> new JwtService(" ", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT_SECRET must be configured for the active Spring profile");
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtService("short", 60_000))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("JWT_SECRET must be at least 32 bytes for HS256 signing");
    }
}
