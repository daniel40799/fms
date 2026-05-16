package com.fapor7.fms.users;

import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.roles.RoleEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.roles.RoleRepository;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implements user administration logic.
 *
 * <p>The service creates accounts, validates organization and role references,
 * hashes passwords, applies the default end-user role when needed, and maps
 * user entities into API-safe response records.</p>
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Returns all user accounts for user administration views.
     *
     * @return list of users mapped to response DTOs
     */
    public List<UserResponse> findAll() {
        return userRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Creates a new active user account.
     *
     * <p>If no roles are supplied, the user is assigned {@link RoleName#END_USER}.
     * When an organization id is supplied, it must reference an existing
     * organization.</p>
     *
     * @param request user creation payload
     * @return created user response
     * @throws RuntimeException when the email, organization, or role data is invalid
     */
    public UserResponse create(UserCreateRequest request) {
        userRepository.findByEmail(request.email()).ifPresent(user -> {
            throw new RuntimeException("Email already exists");
        });

        OrganizationEntity organization = null;

        if (request.organizationId() != null) {
            organization = organizationRepository.findById(request.organizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
        }

        Set<RoleEntity> roles = new HashSet<>();

        if (request.roles() != null && !request.roles().isEmpty()) {
            for (RoleName roleName : request.roles()) {
                RoleEntity role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
        } else {
            RoleEntity defaultRole = roleRepository.findByName(RoleName.END_USER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            roles.add(defaultRole);
        }

        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFullName(request.fullName());
        user.setStatus(UserStatus.ACTIVE);
        user.setOrganization(organization);
        user.setRoles(roles);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
    }

    /**
     * Maps a persisted user into the shape returned by the API.
     *
     * @param user user entity to expose
     * @return user response without password hash
     */
    private UserResponse toResponse(UserEntity user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getStatus().name(),
                user.getOrganization() != null ? user.getOrganization().getId() : null,
                user.getOrganization() != null ? user.getOrganization().getName() : null,
                user.getRoles()
                        .stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet())
        );
    }
}
