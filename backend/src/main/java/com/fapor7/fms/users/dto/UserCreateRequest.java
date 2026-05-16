package com.fapor7.fms.users.dto;

import com.fapor7.fms.roles.RoleName;

import java.util.Set;
import java.util.UUID;

/**
 * Request payload for administrator-created user accounts.
 *
 * @param email login email and unique account identifier
 * @param password raw initial password that will be encoded before storage
 * @param fullName user's display name
 * @param organizationId optional organization affiliation
 * @param roles optional initial role set; defaults to {@code END_USER} when empty
 */
public record UserCreateRequest(
        String email,
        String password,
        String fullName,
        UUID organizationId,
        Set<RoleName> roles
) {
}
