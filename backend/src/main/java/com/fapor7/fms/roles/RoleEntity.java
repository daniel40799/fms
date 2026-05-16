package com.fapor7.fms.roles;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Security role persisted in the database.
 *
 * <p>Roles are attached to users and translated into Spring Security
 * authorities for endpoint authorization.</p>
 */
@Getter
@Setter
@Entity
@Table(name = "roles")
public class RoleEntity {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    private RoleName name;

    private String description;
}
