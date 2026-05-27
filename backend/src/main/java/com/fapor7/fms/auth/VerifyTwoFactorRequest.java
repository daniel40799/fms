package com.fapor7.fms.auth;

import java.util.UUID;

/**
 * Request body for completing a login verification challenge.
 */
public record VerifyTwoFactorRequest(
        UUID challengeId,
        String code
) {
}
