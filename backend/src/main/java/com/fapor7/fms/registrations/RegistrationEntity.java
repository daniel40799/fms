package com.fapor7.fms.registrations;

import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.users.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Participant registration for a FAPOR7 event.
 *
 * <p>The record connects a user to an event and tracks the registration
 * lifecycle: pending payment, uploaded payment proof, administrator approval,
 * QR token generation, and review remarks.</p>
 */
@Getter
@Setter
@Entity
@Table(name = "registrations")
public class RegistrationEntity {

    @Id
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "event_id")
    private EventEntity event;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    private RegistrationStatus status;

    @Column(name = "registered_at")
    private LocalDateTime registeredAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "payment_reference")
    private String paymentReference;

    @Column(name = "payment_file_path")
    private String paymentFilePath;

    @Column(name = "payment_uploaded_at")
    private LocalDateTime paymentUploadedAt;

    @ManyToOne
    @JoinColumn(name = "approved_by")
    private UserEntity approvedBy;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    private String remarks;

    @Column(name = "qr_token")
    private String qrToken;

    @Column(name = "qr_generated_at")
    private LocalDateTime qrGeneratedAt;
}
