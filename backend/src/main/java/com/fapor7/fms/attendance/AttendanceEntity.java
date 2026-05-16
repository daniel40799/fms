package com.fapor7.fms.attendance;

import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.registrations.RegistrationEntity;
import com.fapor7.fms.users.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Attendance log created when a participant is checked in by QR token.
 *
 * <p>The record links the original registration, event, participant, scanning
 * administrator, and timestamp used for participation tracking and certificate
 * eligibility.</p>
 */
@Getter
@Setter
@Entity
@Table(name = "attendance_logs")
public class AttendanceEntity {

    @Id
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "registration_id")
    private RegistrationEntity registration;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private EventEntity event;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne
    @JoinColumn(name = "checked_in_by")
    private UserEntity checkedInBy;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;
}
