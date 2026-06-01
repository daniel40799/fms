package com.fapor7.fms.auth;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body for resending a verification code.
 */
public record ResendTwoFactorRequest(@NotNull UUID challengeId) {
}
