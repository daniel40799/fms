package com.fapor7.fms.organizations;

import com.fapor7.fms.organizations.dto.OrganizationCreateRequest;
import com.fapor7.fms.organizations.dto.OrganizationResponse;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implements organization administration logic.
 *
 * <p>The service creates active organizations and maps organization entities to
 * API responses used by user and event administration screens.</p>
 */
@Service
public class OrganizationService {

    private final OrganizationRepository organizationRepository;

    public OrganizationService(OrganizationRepository organizationRepository) {
        this.organizationRepository = organizationRepository;
    }

    /**
     * Returns all organizations.
     *
     * @return list of organization responses
     */
    public List<OrganizationResponse> findAll() {
        return organizationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Creates an active organization from the submitted name and code.
     *
     * @param request organization creation payload
     * @return created organization response
     */
    public OrganizationResponse create(OrganizationCreateRequest request) {
        OrganizationEntity organization = new OrganizationEntity();
        organization.setId(UUID.randomUUID());
        organization.setName(request.name());
        organization.setCode(request.code());
        organization.setStatus("ACTIVE");
        organization.setCreatedAt(LocalDateTime.now());
        organization.setUpdatedAt(LocalDateTime.now());

        return toResponse(organizationRepository.save(organization));
    }

    /**
     * Maps a persisted organization to the API response shape.
     *
     * @param organization organization entity
     * @return organization response
     */
    private OrganizationResponse toResponse(OrganizationEntity organization) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.getCode(),
                organization.getStatus()
        );
    }
}
