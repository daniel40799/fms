package com.fapor7.fms.users.dto;

import java.util.UUID;

/**
 * Organization membership returned with user profile responses.
 */
public record UserOrganizationResponse(
        UUID id,
        String name,
        String code,
        String status
) {
}
