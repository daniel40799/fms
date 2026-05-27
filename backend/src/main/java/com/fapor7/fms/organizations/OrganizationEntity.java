package com.fapor7.fms.organizations;

import com.fapor7.fms.users.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
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

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "organization_holders",
            joinColumns = @JoinColumn(name = "organization_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<UserEntity> holders = new HashSet<>();
}
