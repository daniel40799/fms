package com.fapor7.fms.organizations;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Organization or association represented in the FAPOR7 ecosystem.
 *
 * <p>Organizations can be assigned to users for affiliation management and to
 * events for ownership, filtering, and reporting.</p>
 */
@Getter
@Setter
@Entity
@Table(name = "organizations")
public class OrganizationEntity {

    @Id
    private UUID id;

    private String name;

    private String code;

    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
