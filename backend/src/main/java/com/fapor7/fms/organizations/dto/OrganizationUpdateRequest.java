package com.fapor7.fms.organizations.dto;

import java.util.Set;
import java.util.UUID;

/**
 * Request payload for editing an organization and its holder assignments.
 */
public record OrganizationUpdateRequest(
        String name,
        String code,
        String status,
        Set<UUID> holderIds
) {
}
