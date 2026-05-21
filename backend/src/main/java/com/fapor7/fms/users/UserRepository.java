package com.fapor7.fms.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.jspecify.annotations.NonNull;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for user records.
 *
 * <p>Provides standard CRUD operations plus email lookup for authentication
 * and duplicate-account checks.</p>
 */
public interface UserRepository extends JpaRepository<@NonNull UserEntity, @NonNull UUID> {

    /**
     * Finds a user by login email.
     *
     * @param email email address to search for
     * @return matching user when present
     */
    Optional<@NonNull UserEntity> findByEmail(String email);

    /**
     * Finds a user by login email without relying on email case.
     *
     * @param email email address to search for
     * @return matching user when present
     */
    Optional<@NonNull UserEntity> findByEmailIgnoreCase(String email);
}
