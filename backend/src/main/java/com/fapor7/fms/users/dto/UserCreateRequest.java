package com.fapor7.fms.users.dto;

import com.fapor7.fms.roles.RoleName;

import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/**
 * Request payload for administrator-created user accounts.
 *
 * @param email login email and unique account identifier
 * @param password raw initial password that will be encoded before storage
 * @param fullName user's display name
 * @param firstName user's given name
 * @param middleName user's optional middle name
 * @param lastName user's surname
 * @param birthday user's birthday
 * @param sex user-entered sex value
 * @param address user's address
 * @param mobileNumber user's mobile number
 * @param prcNumber user's PRC number
 * @param organizationIds optional organization affiliations
 * @param organizationId legacy single-organization affiliation
 * @param roles optional initial role set; defaults to {@code END_USER} when empty
 */
public record UserCreateRequest(
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
        UUID organizationId,
        Set<RoleName> roles
) {
    public UserCreateRequest(
            String email,
            String password,
            String fullName,
            UUID organizationId,
            Set<RoleName> roles
    ) {
        this(
                email,
                password,
                fullName,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                organizationId == null ? null : Set.of(organizationId),
                organizationId,
                roles
        );
    }

    public Set<UUID> effectiveOrganizationIds() {
        LinkedHashSet<UUID> ids = new LinkedHashSet<>();

        if (organizationIds != null) {
            ids.addAll(organizationIds);
        }

        if (organizationId != null) {
            ids.add(organizationId);
        }

        return ids;
    }
}
