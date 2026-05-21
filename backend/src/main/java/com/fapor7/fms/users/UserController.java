package com.fapor7.fms.users;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserOrganizationUpdateRequest;
import com.fapor7.fms.users.dto.UserProfileUpdateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Exposes current-user details and administrative user management endpoints.
 *
 * <p>End users call {@code /api/me} to hydrate their profile after login.
 * Main and user administrators call the user endpoints to list users and create
 * accounts with organization and role assignments.</p>
 */
@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * Returns a compact profile for the authenticated user.
     *
     * @param authenticatedUser principal resolved from the bearer token
     * @return id, email, name, status, organization name, and role names
     */
    @GetMapping("/api/me")
    public Map<String, Object> me(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        UserEntity user = authenticatedUser.getUser();

        Map<String, Object> profile = new LinkedHashMap<>();
        profile.put("id", user.getId());
        profile.put("email", user.getEmail());
        profile.put("fullName", user.getFullName());
        profile.put("firstName", user.getFirstName());
        profile.put("middleName", user.getMiddleName());
        profile.put("lastName", user.getLastName());
        profile.put("birthday", user.getBirthday());
        profile.put("sex", user.getSex());
        profile.put("address", user.getAddress());
        profile.put("mobileNumber", user.getMobileNumber());
        profile.put("prcNumber", user.getPrcNumber());
        profile.put("status", user.getStatus());
        profile.put("organizationId", user.getOrganization() != null ? user.getOrganization().getId() : null);
        profile.put("organization", user.getOrganization() != null ? user.getOrganization().getName() : null);
        profile.put("organizationCode", user.getOrganization() != null ? user.getOrganization().getCode() : null);
        profile.put("roles", user.getRoles()
                .stream()
                .map(role -> role.getName().name())
                .toList());

        return profile;
    }

    /**
     * Updates editable profile fields for the authenticated user.
     *
     * @param request replacement profile values
     * @param authenticatedUser current user principal
     * @return updated user projection
     */
    @PatchMapping("/api/me")
    public UserResponse updateMe(
            @RequestBody UserProfileUpdateRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return userService.updateProfile(authenticatedUser, request);
    }

    /**
     * Lists users visible to the current administrative role.
     *
     * @param authenticatedUser current administrative principal
     * @return users with organization and role details
     */
    @GetMapping("/api/users")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN') or hasRole('ORGANIZATION_ADMIN')")
    public List<UserResponse> findAll(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return userService.findAll(authenticatedUser);
    }

    /**
     * Creates a user account and assigns requested or default roles.
     *
     * @param request user profile, password, organization, and role data
     * @return created user projection
     */
    @PostMapping("/api/users")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN')")
    public UserResponse create(@RequestBody UserCreateRequest request) {
        return userService.create(request);
    }

    /**
     * Creates users from a CSV upload.
     *
     * @param file CSV file containing user rows
     * @return created user projections
     */
    @PostMapping(value = "/api/users/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN')")
    public List<UserResponse> importCsv(@RequestParam("file") MultipartFile file) {
        return userService.importCsv(file);
    }

    /**
     * Changes an end user's organization affiliation.
     *
     * @param id end user id
     * @param request next organization assignment
     * @param authenticatedUser administrative principal applying the change
     * @return updated user projection
     */
    @PatchMapping("/api/users/{id}/organization")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN') or hasRole('ORGANIZATION_ADMIN')")
    public UserResponse updateOrganization(
            @PathVariable UUID id,
            @RequestBody UserOrganizationUpdateRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return userService.updateOrganization(id, request, authenticatedUser);
    }
}
