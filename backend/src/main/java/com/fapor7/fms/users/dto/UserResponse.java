package com.fapor7.fms.users.dto;

import java.util.Set;
import java.util.UUID;

/**
 * User profile returned by administrative and profile APIs.
 *
 * @param id user id
 * @param email login email
 * @param fullName user's display name
 * @param status account lifecycle state
 * @param organizationId affiliated organization id, if any
 * @param organizationName affiliated organization name, if any
 * @param roles assigned role names used for authorization
 */
public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String status,
        UUID organizationId,
        String organizationName,
        Set<String> roles
) {
}
