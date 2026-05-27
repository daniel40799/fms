package com.fapor7.fms.organizations;

import com.fapor7.fms.organizations.dto.OrganizationCreateRequest;
import com.fapor7.fms.organizations.dto.OrganizationHolderResponse;
import com.fapor7.fms.organizations.dto.OrganizationResponse;
import com.fapor7.fms.organizations.dto.OrganizationUpdateRequest;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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
    private final UserRepository userRepository;

    public OrganizationService(OrganizationRepository organizationRepository, UserRepository userRepository) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Returns all organizations.
     *
     * @return list of organization responses
     */
    public List<OrganizationResponse> findAll() {
        return findAll(true);
    }

    /**
     * Returns all organizations.
     *
     * @param includeHolders whether holder assignments should be included
     * @return list of organization responses
     */
    public List<OrganizationResponse> findAll(boolean includeHolders) {
        return organizationRepository.findAll()
                .stream()
                .map(organization -> toResponse(organization, includeHolders))
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
        organization.setName(requireText(request.name(), "Organization name"));
        organization.setCode(requireText(request.code(), "Organization code"));
        organization.setStatus("ACTIVE");
        organization.setHolders(resolveHolders(request.holderIds()));
        organization.setCreatedAt(LocalDateTime.now());
        organization.setUpdatedAt(LocalDateTime.now());

        return toResponse(organizationRepository.save(organization), true);
    }

    /**
     * Updates an organization's editable fields and holder assignments.
     *
     * @param id organization id
     * @param request updated organization payload
     * @return updated organization response
     */
    public OrganizationResponse update(UUID id, OrganizationUpdateRequest request) {
        OrganizationEntity organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        organization.setName(requireText(request.name(), "Organization name"));
        organization.setCode(requireText(request.code(), "Organization code"));
        organization.setStatus(request.status() == null || request.status().isBlank()
                ? organization.getStatus()
                : request.status().trim());
        organization.setHolders(resolveHolders(request.holderIds()));
        organization.setUpdatedAt(LocalDateTime.now());

        return toResponse(organizationRepository.save(organization), true);
    }

    /**
     * Deletes an organization by id.
     *
     * @param id organization id to delete
     */
    @Transactional
    public void delete(UUID id) {
        OrganizationEntity organization = organizationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        organizationRepository.delete(organization);
    }

    /**
     * Maps a persisted organization to the API response shape.
     *
     * @param organization organization entity
     * @return organization response
     */
    private OrganizationResponse toResponse(OrganizationEntity organization, boolean includeHolders) {
        return new OrganizationResponse(
                organization.getId(),
                organization.getName(),
                organization.getCode(),
                organization.getStatus(),
                includeHolders ? organization.getHolders()
                        .stream()
                        .map(this::toHolderResponse)
                        .toList() : List.of()
        );
    }

    private OrganizationHolderResponse toHolderResponse(UserEntity user) {
        return new OrganizationHolderResponse(user.getId(), user.getFullName(), user.getEmail());
    }

    private Set<UserEntity> resolveHolders(Set<UUID> holderIds) {
        if (holderIds == null || holderIds.isEmpty()) {
            return new HashSet<>();
        }

        Set<UserEntity> holders = new HashSet<>();
        for (UUID holderId : holderIds) {
            UserEntity holder = userRepository.findById(holderId)
                    .orElseThrow(() -> new RuntimeException("Organization holder not found: " + holderId));
            holders.add(holder);
        }

        return holders;
    }

    private String requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new RuntimeException(label + " is required");
        }

        return value.trim();
    }
}
