package com.fapor7.fms.attendance;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data repository for attendance logs.
 *
 * <p>Includes lookup by registration to prevent duplicate check-ins for the
 * same event registration.</p>
 */
public interface AttendanceRepository extends JpaRepository<AttendanceEntity, UUID> {

    /**
     * Finds the attendance log for a registration.
     *
     * @param registrationId registration id
     * @return existing attendance log when already checked in
     */
    Optional<AttendanceEntity> findByRegistrationId(UUID registrationId);
}
