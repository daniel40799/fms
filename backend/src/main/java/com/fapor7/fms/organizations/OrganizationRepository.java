package com.fapor7.fms.organizations;

import org.springframework.data.jpa.repository.JpaRepository;
import org.jspecify.annotations.NonNull;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for organization records.
 *
 * <p>Provides CRUD operations plus lookup by short organization code.</p>
 */
public interface OrganizationRepository extends JpaRepository<@NonNull OrganizationEntity, @NonNull UUID> {

    /**
     * Finds an organization by its unique code.
     *
     * @param code organization code
     * @return matching organization when present
     */
    Optional<@NonNull OrganizationEntity> findByCode(String code);

    /**
     * Finds organizations held by the supplied confirmation user.
     *
     * @param holderId holder user id
     * @return organizations where the user can confirm memberships
     */
    List<OrganizationEntity> findByHolders_Id(UUID holderId);
}
