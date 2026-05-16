package com.fapor7.fms.auth;

/**
 * Response body returned after successful login.
 *
 * @param token signed JWT that clients send as a bearer token
 */
public record LoginResponse(String token) {
}
