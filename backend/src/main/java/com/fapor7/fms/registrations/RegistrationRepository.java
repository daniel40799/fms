package com.fapor7.fms.registrations;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for event registration records.
 *
 * <p>Includes lookups needed to prevent duplicate registrations and to resolve
 * QR tokens during attendance check-in.</p>
 */
public interface RegistrationRepository extends JpaRepository<RegistrationEntity, UUID> {

    /**
     * Finds a registration for a specific event and user pair.
     *
     * @param eventId event id
     * @param userId user id
     * @return matching registration when the user already registered
     */
    Optional<RegistrationEntity> findByEventIdAndUserId(UUID eventId, UUID userId);

    /**
     * Finds a confirmed registration by QR token.
     *
     * @param qrToken token generated during registration approval
     * @return registration that owns the token, when present
     */
    Optional<RegistrationEntity> findByQrToken(String qrToken);
}
