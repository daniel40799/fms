package com.fapor7.fms.events.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Request payload for updating event metadata and status.
 *
 * @param title event name shown to participants
 * @param description event overview or instructions
 * @param venue physical or virtual event location
 * @param startDate event start date and time
 * @param endDate event end date and time
 * @param capacity maximum participant count, if enforced
 * @param registrationOpen registration opening date and time
 * @param registrationClose registration closing date and time
 * @param organizationId optional owning organization
 * @param status optional lifecycle status name
 */
public record EventUpdateRequest(
        String title,
        String description,
        String venue,
        LocalDateTime startDate,
        LocalDateTime endDate,
        Integer capacity,
        LocalDateTime registrationOpen,
        LocalDateTime registrationClose,
        UUID organizationId,
        String status
) {
}
