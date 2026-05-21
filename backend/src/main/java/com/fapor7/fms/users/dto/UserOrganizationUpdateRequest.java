package com.fapor7.fms.users.dto;

import java.util.UUID;

/**
 * Request payload for changing an end user's organization affiliation.
 *
 * @param organizationId organization to assign, or {@code null} to remove affiliation
 */
public record UserOrganizationUpdateRequest(
        UUID organizationId
) {
}
