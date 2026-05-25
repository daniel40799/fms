package com.fapor7.fms.organizations;

import com.fapor7.fms.organizations.dto.OrganizationCreateRequest;
import com.fapor7.fms.organizations.dto.OrganizationResponse;
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
    public List<OrganizationResponse> findAll() {
        return organizationService.findAll();
    }

    /**
     * Creates an active organization.
     *
     * @param request organization name and code
     * @return created organization response
     */
    @PostMapping
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('ORGANIZATION_ADMIN')")
    public OrganizationResponse create(@RequestBody OrganizationCreateRequest request) {
        return organizationService.create(request);
    }

    /**
     * Deletes an organization.
     *
     * @param id organization id
     */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('ORGANIZATION_ADMIN')")
    public void delete(@PathVariable java.util.UUID id) {
        organizationService.delete(id);
    }
}
