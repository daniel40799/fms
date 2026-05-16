package com.fapor7.fms.registrations.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Registration details returned to participants and administrators.
 *
 * @param id registration id
 * @param eventId registered event id
 * @param eventTitle registered event title
 * @param userId participant user id
 * @param userFullName participant display name
 * @param status registration lifecycle status
 * @param registeredAt registration creation timestamp
 * @param paymentReference participant-supplied payment reference
 * @param paymentFilePath server path of uploaded proof, when present
 * @param paymentUploadedAt payment proof upload timestamp
 * @param approvedById administrator id that approved the registration
 * @param approvedByName administrator name that approved the registration
 * @param approvedAt approval timestamp
 * @param remarks administrator approval remarks
 * @param qrToken QR token used for attendance check-in
 * @param qrGeneratedAt QR token generation timestamp
 */
public record RegistrationResponse(
        UUID id,
        UUID eventId,
        String eventTitle,
        UUID userId,
        String userFullName,
        String status,
        LocalDateTime registeredAt,
        String paymentReference,
        String paymentFilePath,
        LocalDateTime paymentUploadedAt,
        UUID approvedById,
        String approvedByName,
        LocalDateTime approvedAt,
        String remarks,
        String qrToken,
        LocalDateTime qrGeneratedAt
) {
}
