package com.fapor7.fms.users.dto;

import java.time.LocalDate;

/**
 * Request payload for the current user to update editable profile fields.
 *
 * @param fullName user's display name
 * @param firstName user's given name
 * @param middleName user's optional middle name
 * @param lastName user's surname
 * @param birthday user's birthday
 * @param sex user-entered sex value
 * @param address user's address
 * @param mobileNumber user's mobile number
 * @param prcNumber seven-digit PRC license number, if applicable
 */
public record UserProfileUpdateRequest(
        String fullName,
        String firstName,
        String middleName,
        String lastName,
        LocalDate birthday,
        String sex,
        String address,
        String mobileNumber,
        String prcNumber
) {
}
