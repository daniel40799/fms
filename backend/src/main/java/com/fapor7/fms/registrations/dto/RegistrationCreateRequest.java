package com.fapor7.fms.registrations.dto;

import java.util.UUID;

/**
 * Request payload for registering the authenticated user for an event.
 *
 * @param eventId event selected for registration
 */
public record RegistrationCreateRequest(
        UUID eventId
) {
}
