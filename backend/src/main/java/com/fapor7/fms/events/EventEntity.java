package com.fapor7.fms.events;

import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.users.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Event record managed by FAPOR7 administrators.
 *
 * <p>Stores the public event details shown to users, registration window,
 * capacity, owning organization, lifecycle status, and the administrator who
 * created the event.</p>
 */
@Getter
@Setter
@Entity
@Table(name = "events")
public class EventEntity {

    @Id
    private UUID id;

    private String title;

    private String description;

    private String venue;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    private Integer capacity;

    @Column(name = "registration_open")
    private LocalDateTime registrationOpen;

    @Column(name = "registration_close")
    private LocalDateTime registrationClose;

    @Enumerated(EnumType.STRING)
    private EventStatus status;

    @ManyToOne
    @JoinColumn(name = "organization_id")
    private OrganizationEntity organization;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private UserEntity createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
