package com.fapor7.fms.attendance.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Attendance log returned by attendance APIs.
 *
 * @param id attendance log id
 * @param registrationId related registration id
 * @param eventId event id
 * @param eventTitle event title
 * @param userId participant user id
 * @param userFullName participant display name
 * @param checkedInById id of the administrator who performed the scan
 * @param checkedInByName display name of the administrator who performed the scan
 * @param checkedInAt timestamp when the check-in was recorded
 */
public record AttendanceResponse(
        UUID id,
        UUID registrationId,
        UUID eventId,
        String eventTitle,
        UUID userId,
        String userFullName,
        UUID checkedInById,
        String checkedInByName,
        LocalDateTime checkedInAt
) {
}
