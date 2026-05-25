package com.fapor7.fms.users.dto;

import java.util.Set;
import java.util.UUID;
import java.time.LocalDate;

/**
 * User profile returned by administrative and profile APIs.
 *
 * @param id user id
 * @param email login email
 * @param fullName user's display name
 * @param firstName user's given name
 * @param middleName user's optional middle name
 * @param lastName user's surname
 * @param birthday user's birthday, if supplied
 * @param sex user-entered sex value, if supplied
 * @param address user's address, if supplied
 * @param mobileNumber user's mobile number, if supplied
 * @param prcNumber user's seven-digit PRC number, if supplied
 * @param profileImageUrl public profile image URL, if supplied
 * @param status account lifecycle state
 * @param organizationId affiliated organization id, if any
 * @param organizationName affiliated organization name, if any
 * @param roles assigned role names used for authorization
 */
public record UserResponse(
        UUID id,
        String email,
        String fullName,
        String firstName,
        String middleName,
        String lastName,
        LocalDate birthday,
        String sex,
        String address,
        String mobileNumber,
        String prcNumber,
        String profileImageUrl,
        String status,
        UUID organizationId,
        String organizationName,
        Set<String> roles
) {
    public UserResponse(
            UUID id,
            String email,
            String fullName,
            String firstName,
            String middleName,
            String lastName,
            LocalDate birthday,
            String sex,
            String address,
            String mobileNumber,
            String prcNumber,
            String status,
            UUID organizationId,
            String organizationName,
            Set<String> roles
    ) {
        this(
                id,
                email,
                fullName,
                firstName,
                middleName,
                lastName,
                birthday,
                sex,
                address,
                mobileNumber,
                prcNumber,
                null,
                status,
                organizationId,
                organizationName,
                roles
        );
    }
}
