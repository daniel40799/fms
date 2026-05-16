package com.fapor7.fms.registrations.dto;

/**
 * Request payload used when an administrator approves a registration.
 *
 * @param remarks optional approval note stored with the registration
 */
public record RegistrationApprovalRequest(
        String remarks
) {
}
