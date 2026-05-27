package com.fapor7.fms.organizations.dto;

import java.util.UUID;

/**
 * User allowed to confirm memberships for an organization.
 */
public record OrganizationHolderResponse(
        UUID id,
        String fullName,
        String email
) {
}
