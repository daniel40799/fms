package com.fapor7.fms.users.dto;

import com.fapor7.fms.roles.RoleName;

import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

/**
 * Request payload for administrator edits to a user account.
 */
public record UserUpdateRequest(
        String email,
        String password,
        String fullName,
        String firstName,
        String middleName,
        String lastName,
        LocalDate birthday,
        String sex,
        String address,
        String mobileNumber,
        String prcNumber,
        Set<UUID> organizationIds,
        Set<RoleName> roles
) {
}
