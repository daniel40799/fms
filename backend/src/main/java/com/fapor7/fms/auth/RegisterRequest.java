package com.fapor7.fms.auth;

import java.util.UUID;

/**
 * Public self-registration payload for creating end-user accounts.
 *
 * @param fullName user's display name
 * @param email login email and unique account identifier
 * @param password raw password that will be encoded before storage
 * @param organizationId selected organization affiliation
 */
public record RegisterRequest(
        String fullName,
        String email,
        String password,
        UUID organizationId
) {
}
