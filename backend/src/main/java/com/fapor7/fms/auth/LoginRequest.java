package com.fapor7.fms.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for email/password login.
 *
 * @param email user email used as the login identifier
 * @param password raw password submitted for verification
 * @param channel optional second-factor channel; omitted keeps the default email-first behavior
 */
public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password,
        TwoFactorChannel channel
) {

    public LoginRequest(String email, String password) {
        this(email, password, null);
    }
}
