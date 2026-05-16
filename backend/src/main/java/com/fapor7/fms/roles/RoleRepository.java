package com.fapor7.fms.roles;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for security roles.
 *
 * <p>Role lookup by name is used during user creation to attach requested
 * authorities or the default end-user role.</p>
 */
public interface RoleRepository extends JpaRepository<RoleEntity, UUID> {

    /**
     * Finds a role by enum name.
     *
     * @param name role name
     * @return matching role when seeded in the database
     */
    Optional<RoleEntity> findByName(RoleName name);
}
