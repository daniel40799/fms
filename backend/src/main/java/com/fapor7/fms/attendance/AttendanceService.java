package com.fapor7.fms.attendance;

import com.fapor7.fms.attendance.dto.AttendanceCheckInRequest;
import com.fapor7.fms.attendance.dto.AttendanceResponse;
import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.registrations.RegistrationEntity;
import com.fapor7.fms.registrations.RegistrationRepository;
import com.fapor7.fms.registrations.RegistrationStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Implements QR attendance check-in rules.
 *
 * <p>The service resolves QR tokens to registrations, requires confirmed
 * registration status, prevents duplicate attendance logs, records who scanned
 * the participant, and maps logs to API response DTOs.</p>
 */
@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final RegistrationRepository registrationRepository;

    public AttendanceService(
            AttendanceRepository attendanceRepository,
            RegistrationRepository registrationRepository
    ) {
        this.attendanceRepository = attendanceRepository;
        this.registrationRepository = registrationRepository;
    }

    /**
     * Creates an attendance log from a registration QR token.
     *
     * @param request QR check-in payload
     * @param authenticatedUser administrator performing the scan
     * @return created attendance response
     * @throws RuntimeException when the QR token is invalid, registration is not confirmed, or attendance already exists
     */
    public AttendanceResponse checkIn(
            AttendanceCheckInRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        RegistrationEntity registration = registrationRepository.findByQrToken(request.qrToken())
                .orElseThrow(() -> new RuntimeException("Invalid QR token"));

        if (registration.getStatus() != RegistrationStatus.CONFIRMED) {
            throw new RuntimeException("Registration is not confirmed");
        }

        attendanceRepository.findByRegistrationId(registration.getId())
                .ifPresent(existing -> {
                    throw new RuntimeException("Participant already checked in");
                });

        AttendanceEntity attendance = new AttendanceEntity();
        attendance.setId(UUID.randomUUID());
        attendance.setRegistration(registration);
        attendance.setEvent(registration.getEvent());
        attendance.setUser(registration.getUser());
        attendance.setCheckedInBy(authenticatedUser.getUser());
        attendance.setCheckedInAt(LocalDateTime.now());

        return toResponse(attendanceRepository.save(attendance));
    }

    /**
     * Returns all attendance logs.
     *
     * @return attendance logs mapped to response DTOs
     */
    public List<AttendanceResponse> findAll() {
        return attendanceRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Maps an attendance entity into the API response shape.
     *
     * @param attendance persisted attendance log
     * @return attendance response with event, participant, scanner, and timestamp
     */
    private AttendanceResponse toResponse(AttendanceEntity attendance) {
        return new AttendanceResponse(
                attendance.getId(),
                attendance.getRegistration().getId(),
                attendance.getEvent().getId(),
                attendance.getEvent().getTitle(),
                attendance.getUser().getId(),
                attendance.getUser().getFullName(),
                attendance.getCheckedInBy().getId(),
                attendance.getCheckedInBy().getFullName(),
                attendance.getCheckedInAt()
        );
    }
}
