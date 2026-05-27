package com.fapor7.fms.organizations.dto;

import java.util.List;
import java.util.UUID;

/**
 * Organization details returned by administrative APIs.
 *
 * @param id organization id
 * @param name full organization name
 * @param code short organization code
 * @param status current organization status
 * @param holders users allowed to confirm submitted memberships
 */
public record OrganizationResponse(
        UUID id,
        String name,
        String code,
        String status,
        List<OrganizationHolderResponse> holders
) {
    public OrganizationResponse(UUID id, String name, String code, String status) {
        this(id, name, code, status, List.of());
    }
}
