package com.fapor7.fms.organizations.dto;

import java.util.Set;
import java.util.UUID;

/**
 * Request payload for creating an organization.
 *
 * @param name full organization name
 * @param code short organization code used for lookup and display
 * @param holderIds users allowed to confirm submitted memberships
 */
public record OrganizationCreateRequest(
        String name,
        String code,
        Set<UUID> holderIds
) {
    public OrganizationCreateRequest(String name, String code) {
        this(name, code, Set.of());
    }
}
