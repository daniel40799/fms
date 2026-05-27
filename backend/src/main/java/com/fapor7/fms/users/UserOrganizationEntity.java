package com.fapor7.fms.users;

import com.fapor7.fms.organizations.OrganizationEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * User-to-organization membership with holder confirmation metadata.
 */
@Getter
@Setter
@Entity
@Table(
        name = "user_organizations",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_user_organizations_user_organization",
                columnNames = {"user_id", "organization_id"}
        )
)
public class UserOrganizationEntity {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "organization_id")
    private OrganizationEntity organization;

    @Enumerated(EnumType.STRING)
    private UserOrganizationStatus status;

    @ManyToOne
    @JoinColumn(name = "confirmed_by")
    private UserEntity confirmedBy;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
