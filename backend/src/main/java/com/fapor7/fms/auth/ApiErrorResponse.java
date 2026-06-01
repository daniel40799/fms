package com.fapor7.fms.auth;

/**
 * Client-facing API error body.
 */
public record ApiErrorResponse(String code, String message) {
}
