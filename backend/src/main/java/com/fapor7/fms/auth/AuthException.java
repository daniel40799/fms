package com.fapor7.fms.auth;

import org.springframework.http.HttpStatus;

/**
 * Authentication failure with a client-safe message and HTTP status.
 */
public class AuthException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    private AuthException(String code, String message, HttpStatus status) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public static AuthException invalidCredentials() {
        return new AuthException("INVALID_CREDENTIALS", "Invalid credentials.", HttpStatus.UNAUTHORIZED);
    }

    public static AuthException inactiveAccount() {
        return new AuthException("INACTIVE_ACCOUNT", "User account is not active.", HttpStatus.FORBIDDEN);
    }

    public static AuthException invalidVerificationCode() {
        return new AuthException("INVALID_VERIFICATION_CODE", "Invalid or expired verification code.", HttpStatus.BAD_REQUEST);
    }

    public static AuthException tooManyVerificationAttempts() {
        return new AuthException(
                "TOO_MANY_VERIFICATION_ATTEMPTS",
                "Too many verification attempts. Please request a new code.",
                HttpStatus.TOO_MANY_REQUESTS
        );
    }

    public static AuthException verificationCooldown() {
        return new AuthException(
                "VERIFICATION_COOLDOWN",
                "Please wait before requesting another verification code.",
                HttpStatus.TOO_MANY_REQUESTS
        );
    }

    public static AuthException verificationUnavailable(String message) {
        return new AuthException("VERIFICATION_UNAVAILABLE", message, HttpStatus.BAD_REQUEST);
    }

    public static AuthException deliveryFailure() {
        return new AuthException(
                "VERIFICATION_DELIVERY_FAILED",
                "Unable to send verification code.",
                HttpStatus.SERVICE_UNAVAILABLE
        );
    }
}
