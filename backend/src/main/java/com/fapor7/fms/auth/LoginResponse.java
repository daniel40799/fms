package com.fapor7.fms.auth;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response body returned after successful login.
 *
 * @param token signed JWT that clients send as a bearer token
 * @param twoFactorRequired whether a verification code must be completed before a token is issued
 * @param challengeId 2FA challenge id when verification is required
 * @param channel delivery channel used for the verification code
 * @param maskedDestination redacted email or mobile destination
 * @param expiresAt challenge expiry timestamp
 */
public record LoginResponse(
        String token,
        boolean twoFactorRequired,
        UUID challengeId,
        String channel,
        String maskedDestination,
        LocalDateTime expiresAt
) {
    public LoginResponse(String token) {
        this(token, false, null, null, null, null);
    }
}
