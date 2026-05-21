package com.fapor7.fms.events.dto;

import java.math.BigDecimal;
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
 * @param registrationPrice participant price shown at registration
 * @param horizontalPosterUrl wide event poster shown in heroes and sliders
 * @param verticalPosterUrl portrait event poster shown in event grids
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
        BigDecimal registrationPrice,
        String horizontalPosterUrl,
        String verticalPosterUrl,
        UUID organizationId,
        String status
) {
}
