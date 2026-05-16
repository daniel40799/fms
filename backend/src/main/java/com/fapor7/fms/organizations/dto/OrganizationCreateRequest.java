package com.fapor7.fms.organizations.dto;

/**
 * Request payload for creating an organization.
 *
 * @param name full organization name
 * @param code short organization code used for lookup and display
 */
public record OrganizationCreateRequest(
        String name,
        String code
) {
}
