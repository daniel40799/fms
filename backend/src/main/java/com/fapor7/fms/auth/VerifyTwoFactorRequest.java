package com.fapor7.fms.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request body for completing a login verification challenge.
 */
public record VerifyTwoFactorRequest(
        @NotNull UUID challengeId,
        @NotBlank String code
) {
}
