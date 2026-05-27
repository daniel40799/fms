package com.fapor7.fms.users.dto;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Request payload for changing an end user's organization affiliation.
 *
 * @param organizationIds organizations to assign
 * @param organizationId legacy single organization to assign, or {@code null} to remove affiliation
 */
public record UserOrganizationUpdateRequest(
        Set<UUID> organizationIds,
        UUID organizationId
) {
    public UserOrganizationUpdateRequest(UUID organizationId) {
        this(organizationId == null ? Set.of() : Set.of(organizationId), organizationId);
    }

    public Set<UUID> effectiveOrganizationIds() {
        LinkedHashSet<UUID> ids = new LinkedHashSet<>();

        if (organizationIds != null) {
            ids.addAll(organizationIds);
        }

        if (organizationId != null) {
            ids.add(organizationId);
        }

        return ids;
    }
}
