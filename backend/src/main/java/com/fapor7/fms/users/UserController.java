package com.fapor7.fms.users;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

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

        return Map.of(
                "id", user.getId(),
                "email", user.getEmail(),
                "fullName", user.getFullName(),
                "status", user.getStatus(),
                "organization", user.getOrganization() != null ? user.getOrganization().getName() : null,
                "roles", user.getRoles()
                        .stream()
                        .map(role -> role.getName().name())
                        .toList()
        );
    }

    /**
     * Lists all users for administrative screens.
     *
     * @return users with organization and role details
     */
    @GetMapping("/api/users")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN')")
    public List<UserResponse> findAll() {
        return userService.findAll();
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
}
