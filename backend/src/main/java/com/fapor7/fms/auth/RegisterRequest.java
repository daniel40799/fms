package com.fapor7.fms.auth;

import java.util.Set;
import java.util.UUID;

/**
 * Public self-registration payload for creating end-user accounts.
 *
 * @param fullName user's display name
 * @param email login email and unique account identifier
 * @param password raw password that will be encoded before storage
 * @param mobileNumber mobile number used for future SMS verification
 * @param organizationIds selected organization affiliations
 * @param organizationId legacy selected organization affiliation
 */
public record RegisterRequest(
        String fullName,
        String email,
        String password,
        String mobileNumber,
        Set<UUID> organizationIds,
        UUID organizationId
) {
    public RegisterRequest(String fullName, String email, String password, UUID organizationId) {
        this(fullName, email, password, null, organizationId == null ? Set.of() : Set.of(organizationId), organizationId);
    }
}
