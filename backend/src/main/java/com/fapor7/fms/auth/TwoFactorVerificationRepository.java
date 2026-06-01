package com.fapor7.fms.auth;

import org.jspecify.annotations.NonNull;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for login verification challenges.
 */
public interface TwoFactorVerificationRepository extends JpaRepository<@NonNull TwoFactorVerificationEntity, @NonNull UUID> {

    Optional<TwoFactorVerificationEntity> findFirstByUserIdAndStatusOrderByCreatedAtDesc(
            UUID userId,
            TwoFactorStatus status
    );

    List<TwoFactorVerificationEntity> findByUserIdAndStatus(UUID userId, TwoFactorStatus status);

    long countByUserIdAndCreatedAtAfter(UUID userId, LocalDateTime createdAfter);
}
