package com.fapor7.fms.events.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event details returned by event APIs.
 *
 * @param id event id
 * @param title event name
 * @param description event overview or instructions
 * @param venue event location
 * @param startDate event start date and time
 * @param endDate event end date and time
 * @param capacity maximum participant count, if set
 * @param registrationOpen registration opening date and time
 * @param registrationClose registration closing date and time
 * @param registrationPrice participant price shown at registration
 * @param horizontalPosterUrl wide event poster shown in heroes and sliders
 * @param verticalPosterUrl portrait event poster shown in event grids
 * @param status event lifecycle status
 * @param organizationId owning organization id, if any
 * @param organizationName owning organization name, if any
 * @param createdById administrator id that created the event
 * @param createdByName administrator display name that created the event
 */
public record EventResponse(
        UUID id,
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
        String status,
        UUID organizationId,
        String organizationName,
        UUID createdById,
        String createdByName
) {
}
