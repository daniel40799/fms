package com.fapor7.fms.organizations.dto;

import java.util.UUID;

/**
 * Organization details returned by administrative APIs.
 *
 * @param id organization id
 * @param name full organization name
 * @param code short organization code
 * @param status current organization status
 */
public record OrganizationResponse(
        UUID id,
        String name,
        String code,
        String status
) {
}
