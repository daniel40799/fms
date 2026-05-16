package com.fapor7.fms.organizations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for organization records.
 *
 * <p>Provides CRUD operations plus lookup by short organization code.</p>
 */
public interface OrganizationRepository extends JpaRepository<OrganizationEntity, UUID> {

    /**
     * Finds an organization by its unique code.
     *
     * @param code organization code
     * @return matching organization when present
     */
    Optional<OrganizationEntity> findByCode(String code);
}
