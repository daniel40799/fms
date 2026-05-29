package com.fapor7.fms.config;

import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.roles.RoleEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.roles.RoleRepository;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserOrganizationEntity;
import com.fapor7.fms.users.UserOrganizationStatus;
import com.fapor7.fms.users.UserRepository;
import com.fapor7.fms.users.UserStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Optional first-admin bootstrap driven entirely by environment variables.
 */
@Component
public class InitialAdminSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;
    private final String fullName;

    public InitialAdminSeeder(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.initial-admin.email:}") String email,
            @Value("${app.initial-admin.password:}") String password,
            @Value("${app.initial-admin.full-name:}") String fullName
    ) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = trimToNull(email);
        this.password = trimToNull(password);
        this.fullName = trimToNull(fullName);
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (email == null && password == null && fullName == null) {
            return;
        }

        if (email == null || password == null || fullName == null) {
            throw new IllegalStateException(
                    "INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_PASSWORD, and INITIAL_ADMIN_FULL_NAME must be set together"
            );
        }

        RoleEntity mainAdminRole = roleRepository.findByName(RoleName.MAIN_ADMIN)
                .orElseThrow(() -> new IllegalStateException("MAIN_ADMIN role is missing"));

        boolean existingAdmin = userRepository.findAll()
                .stream()
                .anyMatch(user -> user.getRoles()
                        .stream()
                        .anyMatch(role -> role.getName() == RoleName.MAIN_ADMIN));

        if (existingAdmin) {
            return;
        }

        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            throw new IllegalStateException("Initial admin email already belongs to an existing non-admin user");
        });

        OrganizationEntity fapor7 = organizationRepository.findByCode("FAPOR7").orElse(null);
        UserEntity admin = new UserEntity();
        admin.setId(UUID.randomUUID());
        admin.setEmail(email.toLowerCase(Locale.ROOT));
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setFullName(fullName);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setOrganization(fapor7);
        admin.setRoles(Set.of(mainAdminRole));
        admin.setCreatedAt(LocalDateTime.now());
        admin.setUpdatedAt(LocalDateTime.now());

        if (fapor7 != null) {
            admin.getOrganizationMemberships().add(confirmedMembership(admin, fapor7, null));
        }

        userRepository.save(admin);
    }

    private UserOrganizationEntity confirmedMembership(
            UserEntity user,
            OrganizationEntity organization,
            UserEntity confirmedBy
    ) {
        LocalDateTime now = LocalDateTime.now();
        UserOrganizationEntity membership = new UserOrganizationEntity();
        membership.setId(UUID.randomUUID());
        membership.setUser(user);
        membership.setOrganization(organization);
        membership.setStatus(UserOrganizationStatus.CONFIRMED);
        membership.setConfirmedBy(confirmedBy);
        membership.setConfirmedAt(now);
        membership.setCreatedAt(now);
        membership.setUpdatedAt(now);
        return membership;
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
