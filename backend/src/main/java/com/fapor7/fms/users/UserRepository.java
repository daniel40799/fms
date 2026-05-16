package com.fapor7.fms.users;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for user records.
 *
 * <p>Provides standard CRUD operations plus email lookup for authentication
 * and duplicate-account checks.</p>
 */
public interface UserRepository extends JpaRepository<UserEntity, UUID> {

    /**
     * Finds a user by login email.
     *
     * @param email email address to search for
     * @return matching user when present
     */
    Optional<UserEntity> findByEmail(String email);
}
