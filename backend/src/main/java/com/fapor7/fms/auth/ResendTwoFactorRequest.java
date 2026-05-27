package com.fapor7.fms.auth;

import java.util.UUID;

/**
 * Request body for resending a verification code.
 */
public record ResendTwoFactorRequest(UUID challengeId) {
}
