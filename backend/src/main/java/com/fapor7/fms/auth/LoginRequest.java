package com.fapor7.fms.auth;

/**
 * Request body for email/password login.
 *
 * @param email user email used as the login identifier
 * @param password raw password submitted for verification
 */
public record LoginRequest(String email, String password) {
}
