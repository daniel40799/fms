package com.fapor7.fms.attendance.dto;

/**
 * Request payload for QR-based attendance check-in.
 *
 * @param qrToken token generated when a registration is approved
 */
public record AttendanceCheckInRequest(
        String qrToken
) {
}
