package com.fapor7.fms.config;

import com.fapor7.fms.attendance.AttendanceEntity;
import com.fapor7.fms.attendance.AttendanceRepository;
import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.events.EventRepository;
import com.fapor7.fms.events.EventStatus;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.registrations.RegistrationEntity;
import com.fapor7.fms.registrations.RegistrationRepository;
import com.fapor7.fms.registrations.RegistrationStatus;
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
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Local/dev-only demo data that replaces unsafe Flyway demo seeding for new environments.
 */
@Component
@Profile({"local", "dev"})
public class DevDataSeeder implements ApplicationRunner {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final EventRepository eventRepository;
    private final RegistrationRepository registrationRepository;
    private final AttendanceRepository attendanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final boolean enabled;
    private final String seedPassword;

    public DevDataSeeder(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            RoleRepository roleRepository,
            EventRepository eventRepository,
            RegistrationRepository registrationRepository,
            AttendanceRepository attendanceRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.dev-seed.enabled:false}") boolean enabled,
            @Value("${app.dev-seed.password:}") String seedPassword
    ) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.attendanceRepository = attendanceRepository;
        this.passwordEncoder = passwordEncoder;
        this.enabled = enabled;
        this.seedPassword = seedPassword == null ? "" : seedPassword.trim();
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!enabled) {
            return;
        }

        if (seedPassword.isBlank()) {
            throw new IllegalStateException("APP_DEV_SEED_PASSWORD is required when APP_DEV_SEED_ENABLED=true");
        }

        Map<RoleName, RoleEntity> roles = loadRoles();
        OrganizationEntity fapor7 = ensureOrganization(
                "11111111-1111-1111-1111-111111111111",
                "FAPOR7",
                "FAPOR7"
        );
        OrganizationEntity demoCouncil = ensureOrganization(
                "77000000-0000-0000-0000-000000000001",
                "Cebu Allied Professionals Council",
                "DEMO-01"
        );
        OrganizationEntity demoDigital = ensureOrganization(
                "77000000-0000-0000-0000-000000000008",
                "Digital Practice Consortium",
                "DEMO-08"
        );

        ensureUser(
                "22222222-2222-2222-2222-222222222222",
                "daniel@fapor7.org",
                "FAPOR7 Main Administrator",
                fapor7,
                roles,
                RoleName.MAIN_ADMIN
        );
        ensureUser(
                "33333333-3333-3333-3333-333333333333",
                "user.admin@fapor7.org",
                "FAPOR7 User Administrator",
                fapor7,
                roles,
                RoleName.USER_ADMIN
        );
        UserEntity eventAdmin = ensureUser(
                "44444444-4444-4444-4444-444444444444",
                "event.admin@fapor7.org",
                "FAPOR7 Event Administrator",
                fapor7,
                roles,
                RoleName.EVENT_ADMIN
        );
        UserEntity organizationAdmin = ensureUser(
                "55555555-5555-5555-5555-555555555555",
                "organization.admin@fapor7.org",
                "FAPOR7 Organization Administrator",
                fapor7,
                roles,
                RoleName.ORGANIZATION_ADMIN
        );
        ensureUser(
                "66666666-6666-6666-6666-666666666666",
                "exhibitor@fapor7.org",
                "FAPOR7 Exhibitor",
                fapor7,
                roles,
                RoleName.EXHIBITOR
        );
        ensureUser(
                "77777777-7777-7777-7777-777777777777",
                "end.user@fapor7.org",
                "FAPOR7 End User",
                fapor7,
                roles,
                RoleName.END_USER
        );

        ensureHolder(fapor7, organizationAdmin);
        ensureHolder(demoCouncil, organizationAdmin);
        ensureHolder(demoDigital, organizationAdmin);

        UserEntity memberOne = ensureUser(
                "88000000-0000-0000-0000-000000000001",
                "member.user01@example.test",
                "Demo Participant 01",
                demoCouncil,
                roles,
                RoleName.END_USER
        );
        UserEntity memberTwo = ensureUser(
                "88000000-0000-0000-0000-000000000002",
                "member.user02@example.test",
                "Demo Participant 02",
                demoDigital,
                roles,
                RoleName.END_USER
        );

        EventEntity convention = ensureEvent(
                "99000000-0000-0000-0000-000000000001",
                "Region Seven Professional Convention",
                "A demo convention for local and Azure dev validation.",
                "Waterfront Cebu City Hotel",
                LocalDateTime.of(2026, 6, 6, 8, 0),
                LocalDateTime.of(2026, 6, 6, 17, 30),
                new BigDecimal("1800.00"),
                "/seed-posters/convention-wide.png",
                "/seed-posters/convention-portrait.png",
                demoCouncil,
                eventAdmin,
                EventStatus.PUBLISHED
        );
        EventEntity expo = ensureEvent(
                "99000000-0000-0000-0000-000000000002",
                "Practice Innovation Expo",
                "A demo expo for registration and attendance workflows.",
                "SM Seaside City Cebu Convention Hall",
                LocalDateTime.of(2026, 6, 13, 9, 0),
                LocalDateTime.of(2026, 6, 13, 18, 0),
                new BigDecimal("950.00"),
                "/seed-posters/expo-wide.png",
                "/seed-posters/expo-portrait.png",
                demoDigital,
                eventAdmin,
                EventStatus.PUBLISHED
        );

        RegistrationEntity confirmed = ensureRegistration(
                "aa000000-0000-0000-0000-000000000001",
                convention,
                memberOne,
                eventAdmin,
                RegistrationStatus.CONFIRMED
        );
        ensureRegistration(
                "aa000000-0000-0000-0000-000000000002",
                expo,
                memberTwo,
                eventAdmin,
                RegistrationStatus.PAYMENT_UPLOADED
        );
        ensureAttendance(
                "bb000000-0000-0000-0000-000000000001",
                confirmed,
                eventAdmin
        );
    }

    private Map<RoleName, RoleEntity> loadRoles() {
        Map<RoleName, RoleEntity> roles = new LinkedHashMap<>();
        for (RoleName roleName : RoleName.values()) {
            roles.put(roleName, roleRepository.findByName(roleName)
                    .orElseThrow(() -> new IllegalStateException("Missing role seed: " + roleName)));
        }
        return roles;
    }

    private OrganizationEntity ensureOrganization(String id, String name, String code) {
        UUID organizationId = UUID.fromString(id);
        return organizationRepository.findById(organizationId)
                .map(organization -> requireSeedOrganization(organization, name, code))
                .orElseGet(() -> {
                    organizationRepository.findByCode(code).ifPresent(existing -> {
                        throw new IllegalStateException("Dev seed organization code already exists with a different id: " + code);
                    });

                    LocalDateTime now = LocalDateTime.now();
                    OrganizationEntity organization = new OrganizationEntity();
                    organization.setId(organizationId);
                    organization.setName(name);
                    organization.setCode(code);
                    organization.setStatus("ACTIVE");
                    organization.setCreatedAt(now);
                    organization.setUpdatedAt(now);
                    return organizationRepository.save(organization);
                });
    }

    private OrganizationEntity requireSeedOrganization(OrganizationEntity organization, String name, String code) {
        if (!code.equals(organization.getCode()) || !name.equals(organization.getName())) {
            throw new IllegalStateException("Dev seed organization id collides with a non-seed organization: " + organization.getId());
        }

        return organization;
    }

    private UserEntity ensureUser(
            String id,
            String email,
            String fullName,
            OrganizationEntity organization,
            Map<RoleName, RoleEntity> availableRoles,
            RoleName... roleNames
    ) {
        UUID userId = UUID.fromString(id);
        UserEntity user = userRepository.findById(userId)
                .map(existing -> {
                    requireSeedUser(existing, email, fullName);
                    return existing;
                })
                .orElseGet(() -> {
                    userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
                        throw new IllegalStateException("Dev seed user email already exists with a different id: " + email);
                    });
                    return newUser(userId, email, fullName, organization, availableRoles, roleNames);
                });

        boolean changed = false;
        Set<RoleName> existingRoles = user.getRoles()
                .stream()
                .map(RoleEntity::getName)
                .collect(Collectors.toSet());

        for (RoleName roleName : roleNames) {
            if (!existingRoles.contains(roleName)) {
                user.getRoles().add(availableRoles.get(roleName));
                changed = true;
            }
        }

        if (organization != null && user.getOrganizationMemberships()
                .stream()
                .noneMatch(membership -> membership.getOrganization().getId().equals(organization.getId()))) {
            user.getOrganizationMemberships().add(confirmedMembership(user, organization, null));
            user.setOrganization(organization);
            changed = true;
        }

        if (changed) {
            user.setUpdatedAt(LocalDateTime.now());
            return userRepository.save(user);
        }

        return user;
    }

    private void requireSeedUser(UserEntity user, String email, String fullName) {
        if (!email.equalsIgnoreCase(user.getEmail()) || !fullName.equals(user.getFullName())) {
            throw new IllegalStateException("Dev seed user id collides with a non-seed user: " + user.getId());
        }
    }

    private UserEntity newUser(
            UUID id,
            String email,
            String fullName,
            OrganizationEntity organization,
            Map<RoleName, RoleEntity> availableRoles,
            RoleName... roleNames
    ) {
        LocalDateTime now = LocalDateTime.now();
        UserEntity user = new UserEntity();
        user.setId(id);
        user.setEmail(email.toLowerCase(Locale.ROOT));
        user.setPasswordHash(passwordEncoder.encode(seedPassword));
        user.setFullName(fullName);
        user.setFirstName(firstName(fullName));
        user.setLastName(lastName(fullName));
        user.setBirthday(LocalDate.of(1990, 1, 1));
        user.setSex(null);
        user.setAddress("Cebu City");
        user.setMobileNumber("+639171000000");
        user.setPrcNumber(null);
        user.setStatus(UserStatus.ACTIVE);
        user.setOrganization(organization);
        user.setRoles(Arrays.stream(roleNames).map(availableRoles::get).collect(Collectors.toSet()));
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        if (organization != null) {
            user.getOrganizationMemberships().add(confirmedMembership(user, organization, null));
        }

        return userRepository.save(user);
    }

    private void ensureHolder(OrganizationEntity organization, UserEntity holder) {
        boolean exists = organization.getHolders()
                .stream()
                .anyMatch(existing -> existing.getId().equals(holder.getId()));

        if (!exists) {
            organization.getHolders().add(holder);
            organization.setUpdatedAt(LocalDateTime.now());
            organizationRepository.save(organization);
        }
    }

    private EventEntity ensureEvent(
            String id,
            String title,
            String description,
            String venue,
            LocalDateTime startsAt,
            LocalDateTime endsAt,
            BigDecimal price,
            String horizontalPosterUrl,
            String verticalPosterUrl,
            OrganizationEntity organization,
            UserEntity createdBy,
            EventStatus status
    ) {
        UUID eventId = UUID.fromString(id);
        return eventRepository.findById(eventId)
                .map(event -> requireSeedEvent(event, title, organization))
                .orElseGet(() -> {
                    EventEntity event = new EventEntity();
                    event.setId(eventId);
                    event.setTitle(title);
                    event.setDescription(description);
                    event.setVenue(venue);
                    event.setStartDate(startsAt);
                    event.setEndDate(endsAt);
                    event.setCapacity(500);
                    event.setRegistrationOpen(startsAt.minusDays(14));
                    event.setRegistrationClose(startsAt.minusDays(1));
                    event.setRegistrationPrice(price);
                    event.setHorizontalPosterUrl(horizontalPosterUrl);
                    event.setVerticalPosterUrl(verticalPosterUrl);
                    event.setStatus(status);
                    event.setOrganization(organization);
                    event.setCreatedBy(createdBy);
                    event.setCreatedAt(LocalDateTime.now());
                    event.setUpdatedAt(LocalDateTime.now());
                    return eventRepository.save(event);
                });
    }

    private EventEntity requireSeedEvent(EventEntity event, String title, OrganizationEntity organization) {
        if (!title.equals(event.getTitle())
                || event.getOrganization() == null
                || !event.getOrganization().getId().equals(organization.getId())) {
            throw new IllegalStateException("Dev seed event id collides with a non-seed event: " + event.getId());
        }

        return event;
    }

    private RegistrationEntity ensureRegistration(
            String id,
            EventEntity event,
            UserEntity user,
            UserEntity approvedBy,
            RegistrationStatus status
    ) {
        UUID registrationId = UUID.fromString(id);
        return registrationRepository.findById(registrationId)
                .map(registration -> requireSeedRegistration(registration, event, user))
                .orElseGet(() -> {
                    registrationRepository.findByEventIdAndUserId(event.getId(), user.getId()).ifPresent(existing -> {
                        throw new IllegalStateException(
                                "Dev seed registration event/user pair already exists with a different id: " + existing.getId()
                        );
                    });

                    LocalDateTime now = LocalDateTime.now();
                    RegistrationEntity registration = new RegistrationEntity();
                    registration.setId(registrationId);
                    registration.setEvent(event);
                    registration.setUser(user);
                    registration.setStatus(status);
                    registration.setRegisteredAt(now.minusDays(2));
                    registration.setUpdatedAt(now);

                    if (status == RegistrationStatus.PAYMENT_UPLOADED || status == RegistrationStatus.CONFIRMED) {
                        registration.setPaymentReference("DEMO-PAY-" + id.substring(id.length() - 4));
                        registration.setPaymentUploadedAt(now.minusDays(1));
                    }

                    if (status == RegistrationStatus.CONFIRMED) {
                        registration.setApprovedBy(approvedBy);
                        registration.setApprovedAt(now);
                        registration.setRemarks("Seeded local/dev confirmation.");
                        registration.setQrToken("demo-qr-" + id.substring(id.length() - 4));
                        registration.setQrGeneratedAt(now);
                    }

                    return registrationRepository.save(registration);
                });
    }

    private RegistrationEntity requireSeedRegistration(
            RegistrationEntity registration,
            EventEntity event,
            UserEntity user
    ) {
        if (registration.getEvent() == null
                || registration.getUser() == null
                || !registration.getEvent().getId().equals(event.getId())
                || !registration.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Dev seed registration id collides with a non-seed registration: " + registration.getId());
        }

        return registration;
    }

    private void ensureAttendance(String id, RegistrationEntity registration, UserEntity checkedInBy) {
        UUID attendanceId = UUID.fromString(id);
        attendanceRepository.findById(attendanceId).ifPresentOrElse(
                attendance -> requireSeedAttendance(attendance, registration),
                () -> {
                    attendanceRepository.findByRegistrationId(registration.getId()).ifPresent(existing -> {
                        throw new IllegalStateException(
                                "Dev seed attendance registration already exists with a different id: " + existing.getId()
                        );
                    });

                    AttendanceEntity attendance = new AttendanceEntity();
                    attendance.setId(attendanceId);
                    attendance.setRegistration(registration);
                    attendance.setEvent(registration.getEvent());
                    attendance.setUser(registration.getUser());
                    attendance.setCheckedInBy(checkedInBy);
                    attendance.setCheckedInAt(LocalDateTime.now());
                    attendanceRepository.save(attendance);
                }
        );
    }

    private void requireSeedAttendance(AttendanceEntity attendance, RegistrationEntity registration) {
        if (attendance.getRegistration() == null
                || !attendance.getRegistration().getId().equals(registration.getId())) {
            throw new IllegalStateException("Dev seed attendance id collides with a non-seed attendance: " + attendance.getId());
        }
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

    private String firstName(String fullName) {
        int space = fullName.indexOf(' ');
        return space < 0 ? fullName : fullName.substring(0, space);
    }

    private String lastName(String fullName) {
        int space = fullName.lastIndexOf(' ');
        return space < 0 ? fullName : fullName.substring(space + 1);
    }
}
