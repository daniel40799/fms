package com.fapor7.fms.organizations;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.organizations.dto.OrganizationCreateRequest;
import com.fapor7.fms.organizations.dto.OrganizationResponse;
import com.fapor7.fms.organizations.dto.OrganizationUpdateRequest;
import com.fapor7.fms.roles.RoleName;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Exposes organization administration endpoints.
 *
 * <p>Organizations represent FAPOR7 member organizations or related groups
 * that users and events may be attached to. Organization data supports
 * affiliation management and reporting.</p>
 */
@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    /**
     * Lists all organizations for administration and public self-registration.
     *
     * @return organization response records
     */
    @GetMapping
    public List<OrganizationResponse> findAll(@AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        return organizationService.findAll(canViewHolderAssignments(authenticatedUser));
    }

    /**
     * Creates an active organization.
     *
     * @param request organization name and code
     * @return created organization response
     */
    @PostMapping
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN')")
    public OrganizationResponse create(@RequestBody OrganizationCreateRequest request) {
        return organizationService.create(request);
    }

    /**
     * Updates organization details and holder assignments.
     *
     * @param id organization id
     * @param request replacement organization details
     * @return updated organization response
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN')")
    public OrganizationResponse update(
            @PathVariable java.util.UUID id,
            @RequestBody OrganizationUpdateRequest request
    ) {
        return organizationService.update(id, request);
    }

    /**
     * Deletes an organization.
     *
     * @param id organization id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('USER_ADMIN')")
    public void delete(@PathVariable java.util.UUID id) {
        organizationService.delete(id);
    }

    private boolean canViewHolderAssignments(AuthenticatedUser authenticatedUser) {
        return authenticatedUser != null && authenticatedUser.getUser()
                .getRoles()
                .stream()
                .anyMatch(role -> role.getName() == RoleName.MAIN_ADMIN
                        || role.getName() == RoleName.USER_ADMIN
                        || role.getName() == RoleName.ORGANIZATION_ADMIN);
    }
}
