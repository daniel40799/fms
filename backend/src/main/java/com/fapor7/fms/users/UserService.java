package com.fapor7.fms.users;

import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.roles.RoleEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.roles.RoleRepository;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserOrganizationUpdateRequest;
import com.fapor7.fms.users.dto.UserOrganizationResponse;
import com.fapor7.fms.users.dto.UserProfileUpdateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import com.fapor7.fms.users.dto.UserUpdateRequest;
import com.fapor7.fms.auth.AuthenticatedUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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

    private static final Path PROFILE_PICTURE_UPLOAD_DIR = Path.of("uploads", "profile-pictures");
    private static final String PROFILE_PICTURE_URL_PREFIX = "/uploads/profile-pictures/";
    private static final long MAX_PROFILE_PICTURE_BYTES = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_PROFILE_PICTURE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "gif");
    private static final String MOBILE_NUMBER_MESSAGE = "Mobile number must be in 09XXXXXXXXX or +639XXXXXXXXX format.";

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
     * Returns users visible to the current administrative principal.
     *
     * <p>Main and user administrators see all accounts. Organization
     * administrators see end users that are either unaffiliated or affiliated
     * with their own organization.</p>
     *
     * @param authenticatedUser current administrative principal
     * @return visible user accounts for administration
     */
    public List<UserResponse> findAll(AuthenticatedUser authenticatedUser) {
        UserEntity currentUser = authenticatedUser.getUser();

        if (canManageAllUsers(currentUser)) {
            return findAll();
        }

        Set<UUID> organizationIds = requireHeldOrganizationIds(currentUser);

        return userRepository.findAll()
                .stream()
                .filter(this::isEndUser)
                .filter(user -> hasAnyOrganization(user, organizationIds))
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
        return create(request, UserOrganizationStatus.CONFIRMED, null);
    }

    /**
     * Creates a self-registered end-user account with submitted organization
     * memberships waiting for holder confirmation.
     *
     * @param request public registration payload
     * @return created user response
     */
    public UserResponse createPendingEndUser(UserCreateRequest request) {
        return create(request, UserOrganizationStatus.PENDING, null);
    }

    private UserResponse create(
            UserCreateRequest request,
            UserOrganizationStatus organizationStatus,
            UserEntity confirmedBy
    ) {
        String email = requireEmail(request.email());
        userRepository.findByEmail(email).ifPresent(user -> {
            throw new RuntimeException("Email already exists");
        });

        Set<OrganizationEntity> organizations = resolveOrganizations(request.effectiveOrganizationIds());

        Set<RoleEntity> roles = resolveRoles(request.roles());
        String fullName = resolveFullName(request.fullName(), request.firstName(), request.middleName(), request.lastName());

        UserEntity user = new UserEntity();
        user.setId(UUID.randomUUID());
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(requireText(request.password(), "Password")));
        user.setFullName(fullName);
        user.setFirstName(trimToNull(request.firstName()));
        user.setMiddleName(trimToNull(request.middleName()));
        user.setLastName(trimToNull(request.lastName()));
        user.setBirthday(request.birthday());
        user.setSex(trimToNull(request.sex()));
        user.setAddress(trimToNull(request.address()));
        user.setMobileNumber(validateMobileNumber(request.mobileNumber()));
        user.setPrcNumber(validatePrcNumber(request.prcNumber()));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(roles);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        replaceOrganizationMemberships(user, organizations, organizationStatus, confirmedBy);

        return toResponse(userRepository.save(user));
    }

    /**
     * Creates users from a CSV upload.
     *
     * <p>The file must include {@code fullName}, {@code email}, and
     * {@code password} columns. Optional columns are
     * {@code organizationCode} and {@code roles}; multiple roles are separated
     * with {@code |} or {@code ;}. Organization codes are used instead of
     * database ids so administrative exports remain portable.</p>
     *
     * @param file CSV upload containing user rows
     * @return created users
     * @throws RuntimeException when the file or a row is invalid
     */
    @Transactional
    public List<UserResponse> importCsv(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("CSV file is required");
        }

        List<List<String>> records = readCsvRecords(file);
        if (records.isEmpty()) {
            throw new RuntimeException("CSV file has no user rows");
        }

        Map<String, Integer> columns = indexColumns(records.getFirst());
        requireColumn(columns, "fullname");
        requireColumn(columns, "email");
        requireColumn(columns, "password");

        List<UserResponse> importedUsers = new ArrayList<>();

        for (int index = 1; index < records.size(); index++) {
            List<String> record = records.get(index);

            if (isBlankRecord(record)) {
                continue;
            }

            int rowNumber = index + 1;
            String fullName = requiredValue(record, columns, "fullname", rowNumber, "fullName");
            String email = requiredValue(record, columns, "email", rowNumber, "email");
            String password = requiredValue(record, columns, "password", rowNumber, "password");
            UUID organizationId = resolveOrganizationId(optionalValue(record, columns, "organizationcode"), rowNumber);
            Set<RoleName> roles = parseRoles(optionalValue(record, columns, "roles"), rowNumber);

            importedUsers.add(create(new UserCreateRequest(
                    email,
                    password,
                    fullName,
                    organizationId,
                    roles
            )));
        }

        if (importedUsers.isEmpty()) {
            throw new RuntimeException("CSV file has no user rows");
        }

        return importedUsers;
    }

    /**
     * Updates editable profile fields for the authenticated user.
     *
     * @param authenticatedUser current user principal
     * @param request editable profile values
     * @return updated user response
     * @throws RuntimeException when the submitted profile name is blank
     */
    public UserResponse updateProfile(
            AuthenticatedUser authenticatedUser,
            UserProfileUpdateRequest request
    ) {
        UserEntity user = authenticatedUser.getUser();
        String firstName = trimToNull(request.firstName());
        String middleName = trimToNull(request.middleName());
        String lastName = trimToNull(request.lastName());

        if (firstName != null || middleName != null || lastName != null) {
            if (firstName == null || lastName == null) {
                throw new RuntimeException("First and last names are required");
            }

            user.setFirstName(firstName);
            user.setMiddleName(middleName);
            user.setLastName(lastName);
            user.setFullName(joinName(firstName, middleName, lastName));
        } else {
            if (request.fullName() == null || request.fullName().isBlank()) {
                throw new RuntimeException("Full name is required");
            }

            user.setFullName(request.fullName().trim());
        }

        user.setBirthday(request.birthday());
        user.setSex(trimToNull(request.sex()));
        user.setAddress(trimToNull(request.address()));
        user.setMobileNumber(validateMobileNumber(request.mobileNumber()));
        user.setPrcNumber(validatePrcNumber(request.prcNumber()));
        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
    }

    /**
     * Stores a profile image for the authenticated user and exposes it through
     * the public uploads resource handler.
     *
     * @param authenticatedUser current user principal
     * @param file selected image file
     * @return updated user response
     * @throws RuntimeException when the file is missing, invalid, or cannot be stored
     */
    public UserResponse updateProfilePicture(
            AuthenticatedUser authenticatedUser,
            MultipartFile file
    ) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Profile picture is required");
        }

        if (file.getSize() > MAX_PROFILE_PICTURE_BYTES) {
            throw new RuntimeException("Profile picture must be 5 MB or smaller");
        }

        String extension = resolveProfilePictureExtension(file);
        UserEntity user = authenticatedUser.getUser();
        String previousUrl = user.getProfileImageUrl();

        try {
            Path uploadDir = PROFILE_PICTURE_UPLOAD_DIR.toAbsolutePath().normalize();
            Files.createDirectories(uploadDir);

            String filename = user.getId() + "_" + System.currentTimeMillis() + "." + extension;
            Path targetPath = uploadDir.resolve(filename).normalize();

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
            }

            user.setProfileImageUrl(PROFILE_PICTURE_URL_PREFIX + filename);
            user.setUpdatedAt(LocalDateTime.now());
            UserResponse response = toResponse(userRepository.save(user));
            deletePreviousProfilePicture(previousUrl, uploadDir);
            return response;
        } catch (IOException exception) {
            throw new RuntimeException("Failed to upload profile picture", exception);
        }
    }

    /**
     * Updates an end user's organization affiliation.
     *
     * <p>Main and user administrators may assign any organization. An
     * organization administrator may only assign their own organization and
     * may only remove users already affiliated with that organization.</p>
     *
     * @param id end user id to update
     * @param request next organization affiliation
     * @param authenticatedUser administrative principal applying the change
     * @return updated user response
     * @throws RuntimeException when the user or requested organization is missing
     * @throws AccessDeniedException when the principal exceeds affiliation scope
     */
    public UserResponse updateOrganization(
            UUID id,
            UserOrganizationUpdateRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        UserEntity currentUser = authenticatedUser.getUser();
        if (!canManageAllUsers(currentUser)) {
            throw new AccessDeniedException("Use organization confirmation actions for holder-scoped changes");
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isEndUser(user)) {
            throw new AccessDeniedException("Only end-user affiliations can be managed");
        }

        replaceOrganizationMemberships(
                user,
                resolveOrganizations(request.effectiveOrganizationIds()),
                UserOrganizationStatus.CONFIRMED,
                currentUser
        );
        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
    }

    /**
     * Updates administrative account fields, role assignments, and memberships.
     *
     * @param id user id
     * @param request replacement account details
     * @param authenticatedUser administrator applying the change
     * @return updated user response
     */
    public UserResponse update(UUID id, UserUpdateRequest request, AuthenticatedUser authenticatedUser) {
        UserEntity currentUser = authenticatedUser.getUser();
        if (!canManageAllUsers(currentUser)) {
            throw new AccessDeniedException("Only main and user administrators can edit accounts");
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String email = requireEmail(request.email());
        if (!email.equalsIgnoreCase(user.getEmail())) {
            userRepository.findByEmail(email).ifPresent(existing -> {
                if (!existing.getId().equals(user.getId())) {
                    throw new RuntimeException("Email already exists");
                }
            });
            user.setEmail(email);
        }

        String fullName = resolveFullName(request.fullName(), request.firstName(), request.middleName(), request.lastName());
        user.setFullName(fullName);
        user.setFirstName(trimToNull(request.firstName()));
        user.setMiddleName(trimToNull(request.middleName()));
        user.setLastName(trimToNull(request.lastName()));
        user.setBirthday(request.birthday());
        user.setSex(trimToNull(request.sex()));
        user.setAddress(trimToNull(request.address()));
        user.setMobileNumber(validateMobileNumber(request.mobileNumber()));
        user.setPrcNumber(validatePrcNumber(request.prcNumber()));

        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }

        if (request.roles() != null) {
            user.setRoles(resolveRoles(request.roles()));
        }

        if (request.organizationIds() != null) {
            replaceOrganizationMemberships(
                    user,
                    resolveOrganizations(request.organizationIds()),
                    UserOrganizationStatus.CONFIRMED,
                    currentUser
            );
        }

        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
    }

    /**
     * Confirms a user's submitted organization membership.
     *
     * @param userId user id
     * @param organizationId organization id being confirmed
     * @param authenticatedUser confirming administrator or holder
     * @return updated user response
     */
    public UserResponse confirmOrganization(
            UUID userId,
            UUID organizationId,
            AuthenticatedUser authenticatedUser
    ) {
        return setOrganizationConfirmationStatus(
                userId,
                organizationId,
                UserOrganizationStatus.CONFIRMED,
                authenticatedUser
        );
    }

    /**
     * Rejects a user's submitted organization membership.
     *
     * @param userId user id
     * @param organizationId organization id being rejected
     * @param authenticatedUser rejecting administrator or holder
     * @return updated user response
     */
    public UserResponse rejectOrganization(
            UUID userId,
            UUID organizationId,
            AuthenticatedUser authenticatedUser
    ) {
        return setOrganizationConfirmationStatus(
                userId,
                organizationId,
                UserOrganizationStatus.REJECTED,
                authenticatedUser
        );
    }

    /**
     * Deletes a user account.
     *
     * @param id user id to delete
     * @param authenticatedUser administrative principal applying the deletion
     * @throws RuntimeException when the user is missing or tries to delete their own account
     */
    @Transactional
    public void delete(UUID id, AuthenticatedUser authenticatedUser) {
        if (authenticatedUser.getUser().getId().equals(id)) {
            throw new RuntimeException("You cannot delete your own account");
        }

        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        userRepository.delete(user);
    }

    private boolean canManageAllUsers(UserEntity user) {
        return hasRole(user, RoleName.MAIN_ADMIN) || hasRole(user, RoleName.USER_ADMIN);
    }

    private Set<UUID> requireHeldOrganizationIds(UserEntity user) {
        if (!hasRole(user, RoleName.ORGANIZATION_ADMIN)) {
            throw new AccessDeniedException("Organization confirmation requires an organization administrator");
        }

        Set<UUID> holderOrganizationIds = organizationRepository.findByHolders_Id(user.getId())
                .stream()
                .map(OrganizationEntity::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        if (holderOrganizationIds.isEmpty() && user.getOrganization() != null) {
            holderOrganizationIds.add(user.getOrganization().getId());
        }

        if (holderOrganizationIds.isEmpty()) {
            throw new AccessDeniedException("Organization administrator must be assigned as an organization holder");
        }

        return holderOrganizationIds;
    }

    private boolean hasAnyOrganization(UserEntity user, Set<UUID> organizationIds) {
        return user.getOrganizationMemberships()
                .stream()
                .anyMatch(membership -> organizationIds.contains(membership.getOrganization().getId()))
                || (user.getOrganization() != null && organizationIds.contains(user.getOrganization().getId()));
    }

    private void enforceCanConfirmOrganization(UserEntity currentUser, UUID organizationId) {
        if (canManageAllUsers(currentUser)) {
            return;
        }

        Set<UUID> holderOrganizationIds = requireHeldOrganizationIds(currentUser);
        if (!holderOrganizationIds.contains(organizationId)) {
            throw new AccessDeniedException("Cannot confirm another organization's users");
        }
    }

    private UserResponse setOrganizationConfirmationStatus(
            UUID userId,
            UUID organizationId,
            UserOrganizationStatus status,
            AuthenticatedUser authenticatedUser
    ) {
        UserEntity currentUser = authenticatedUser.getUser();
        enforceCanConfirmOrganization(currentUser, organizationId);

        UserEntity user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isEndUser(user)) {
            throw new AccessDeniedException("Only end-user affiliations can be confirmed");
        }

        OrganizationEntity organization = organizationRepository.findById(organizationId)
                .orElseThrow(() -> new RuntimeException("Organization not found"));

        UserOrganizationEntity membership = findMembership(user, organizationId);
        if (membership == null) {
            if (!canManageAllUsers(currentUser)) {
                throw new RuntimeException("User did not submit this organization");
            }
            membership = newMembership(user, organization, UserOrganizationStatus.PENDING, null);
            user.getOrganizationMemberships().add(membership);
        }

        membership.setStatus(status);
        membership.setConfirmedBy(currentUser);
        membership.setConfirmedAt(LocalDateTime.now());
        membership.setUpdatedAt(LocalDateTime.now());
        syncLegacyOrganization(user);
        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
    }

    private boolean isEndUser(UserEntity user) {
        return hasRole(user, RoleName.END_USER);
    }

    private boolean hasRole(UserEntity user, RoleName roleName) {
        return user.getRoles()
                .stream()
                .anyMatch(role -> role.getName() == roleName);
    }

    private Set<RoleEntity> resolveRoles(Set<RoleName> requestedRoles) {
        Set<RoleEntity> roles = new HashSet<>();

        if (requestedRoles != null && !requestedRoles.isEmpty()) {
            for (RoleName roleName : requestedRoles) {
                RoleEntity role = roleRepository.findByName(roleName)
                        .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));
                roles.add(role);
            }
        } else {
            RoleEntity defaultRole = roleRepository.findByName(RoleName.END_USER)
                    .orElseThrow(() -> new RuntimeException("Default role not found"));
            roles.add(defaultRole);
        }

        return roles;
    }

    private Set<OrganizationEntity> resolveOrganizations(Set<UUID> organizationIds) {
        if (organizationIds == null || organizationIds.isEmpty()) {
            return new LinkedHashSet<>();
        }

        Set<OrganizationEntity> organizations = new LinkedHashSet<>();
        for (UUID organizationId : organizationIds) {
            OrganizationEntity organization = organizationRepository.findById(organizationId)
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
            organizations.add(organization);
        }

        return organizations;
    }

    private void replaceOrganizationMemberships(
            UserEntity user,
            Set<OrganizationEntity> organizations,
            UserOrganizationStatus status,
            UserEntity confirmedBy
    ) {
        user.getOrganizationMemberships().clear();

        for (OrganizationEntity organization : organizations) {
            user.getOrganizationMemberships().add(newMembership(user, organization, status, confirmedBy));
        }

        syncLegacyOrganization(user);
    }

    private UserOrganizationEntity newMembership(
            UserEntity user,
            OrganizationEntity organization,
            UserOrganizationStatus status,
            UserEntity confirmedBy
    ) {
        LocalDateTime now = LocalDateTime.now();
        UserOrganizationEntity membership = new UserOrganizationEntity();
        membership.setId(UUID.randomUUID());
        membership.setUser(user);
        membership.setOrganization(organization);
        membership.setStatus(status);
        membership.setCreatedAt(now);
        membership.setUpdatedAt(now);

        if (status == UserOrganizationStatus.CONFIRMED || status == UserOrganizationStatus.REJECTED) {
            membership.setConfirmedBy(confirmedBy);
            membership.setConfirmedAt(now);
        }

        return membership;
    }

    private UserOrganizationEntity findMembership(UserEntity user, UUID organizationId) {
        return user.getOrganizationMemberships()
                .stream()
                .filter(membership -> membership.getOrganization().getId().equals(organizationId))
                .findFirst()
                .orElse(null);
    }

    private void syncLegacyOrganization(UserEntity user) {
        user.setOrganization(user.getOrganizationMemberships()
                .stream()
                .filter(membership -> membership.getStatus() != UserOrganizationStatus.REJECTED)
                .min(Comparator.comparing(membership -> membership.getOrganization().getName()))
                .map(UserOrganizationEntity::getOrganization)
                .orElse(null));
    }

    private String requireEmail(String email) {
        String normalized = trimToNull(email);
        if (normalized == null) {
            throw new RuntimeException("Email is required");
        }

        if (!normalized.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            throw new RuntimeException("Email must be valid");
        }

        return normalized.toLowerCase(Locale.ROOT);
    }

    private String requireText(String value, String label) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new RuntimeException(label + " is required");
        }

        return normalized;
    }

    private String resolveFullName(String fullName, String firstName, String middleName, String lastName) {
        String normalizedFirstName = trimToNull(firstName);
        String normalizedMiddleName = trimToNull(middleName);
        String normalizedLastName = trimToNull(lastName);

        if (normalizedFirstName != null || normalizedMiddleName != null || normalizedLastName != null) {
            if (normalizedFirstName == null || normalizedLastName == null) {
                throw new RuntimeException("First and last names are required");
            }

            return joinName(normalizedFirstName, normalizedMiddleName, normalizedLastName);
        }

        return requireText(fullName, "Full name");
    }

    private List<List<String>> readCsvRecords(MultipartFile file) {
        try {
            return parseCsv(new String(file.getBytes(), StandardCharsets.UTF_8));
        } catch (IOException exception) {
            throw new RuntimeException("Failed to read CSV file", exception);
        }
    }

    private List<List<String>> parseCsv(String csv) {
        List<List<String>> records = new ArrayList<>();
        List<String> record = new ArrayList<>();
        StringBuilder value = new StringBuilder();
        boolean quoted = false;

        for (int index = 0; index < csv.length(); index++) {
            char current = csv.charAt(index);

            if (quoted) {
                if (current == '"') {
                    boolean escapedQuote = index + 1 < csv.length() && csv.charAt(index + 1) == '"';
                    if (escapedQuote) {
                        value.append('"');
                        index++;
                    } else {
                        quoted = false;
                    }
                } else {
                    value.append(current);
                }
                continue;
            }

            if (current == '"' && value.length() == 0) {
                quoted = true;
            } else if (current == ',') {
                record.add(value.toString().trim());
                value.setLength(0);
            } else if (current == '\n') {
                record.add(value.toString().trim());
                records.add(record);
                record = new ArrayList<>();
                value.setLength(0);
            } else if (current != '\r') {
                value.append(current);
            }
        }

        if (quoted) {
            throw new RuntimeException("CSV file has an unterminated quoted value");
        }

        if (!record.isEmpty() || value.length() > 0) {
            record.add(value.toString().trim());
            records.add(record);
        }

        if (!records.isEmpty() && !records.getFirst().isEmpty()) {
            String firstColumn = records.getFirst().getFirst();
            records.getFirst().set(0, firstColumn.replaceFirst("^\uFEFF", ""));
        }

        return records;
    }

    private Map<String, Integer> indexColumns(List<String> header) {
        Map<String, Integer> columns = new LinkedHashMap<>();

        for (int index = 0; index < header.size(); index++) {
            String column = normalizeColumn(header.get(index));
            if (!column.isBlank()) {
                columns.put(column, index);
            }
        }

        return columns;
    }

    private String normalizeColumn(String column) {
        return column.trim()
                .replace("_", "")
                .replace("-", "")
                .toLowerCase(Locale.ROOT);
    }

    private void requireColumn(Map<String, Integer> columns, String column) {
        if (!columns.containsKey(column)) {
            throw new RuntimeException("CSV column is required: " + column);
        }
    }

    private String requiredValue(
            List<String> record,
            Map<String, Integer> columns,
            String column,
            int rowNumber,
            String label
    ) {
        String value = optionalValue(record, columns, column);
        if (value == null || value.isBlank()) {
            throw new RuntimeException("CSV row " + rowNumber + " is missing " + label);
        }

        return value;
    }

    private String optionalValue(List<String> record, Map<String, Integer> columns, String column) {
        Integer index = columns.get(column);
        return index != null && index < record.size() ? record.get(index).trim() : null;
    }

    private UUID resolveOrganizationId(String organizationCode, int rowNumber) {
        if (organizationCode == null || organizationCode.isBlank()) {
            return null;
        }

        return organizationRepository.findByCode(organizationCode)
                .orElseThrow(() -> new RuntimeException(
                        "CSV row " + rowNumber + " references unknown organization code: " + organizationCode
                ))
                .getId();
    }

    private Set<RoleName> parseRoles(String rolesValue, int rowNumber) {
        if (rolesValue == null || rolesValue.isBlank()) {
            return null;
        }

        Set<RoleName> roles = new HashSet<>();

        for (String roleValue : rolesValue.split("[|;]")) {
            String roleName = roleValue.trim();
            if (roleName.isBlank()) {
                continue;
            }

            try {
                roles.add(RoleName.valueOf(roleName.toUpperCase(Locale.ROOT)));
            } catch (IllegalArgumentException exception) {
                throw new RuntimeException("CSV row " + rowNumber + " has unknown role: " + roleName);
            }
        }

        return roles.isEmpty() ? null : roles;
    }

    private boolean isBlankRecord(List<String> record) {
        return record.stream().allMatch(String::isBlank);
    }

    /**
     * Maps a persisted user into the shape returned by the API.
     *
     * @param user user entity to expose
     * @return user response without password hash
     */
    private UserResponse toResponse(UserEntity user) {
        List<UserOrganizationResponse> organizations = organizationResponses(user);
        UserOrganizationResponse primaryOrganization = organizations.stream()
                .filter(organization -> !"REJECTED".equals(organization.status()))
                .findFirst()
                .orElse(null);

        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getFirstName(),
                user.getMiddleName(),
                user.getLastName(),
                user.getBirthday(),
                user.getSex(),
                user.getAddress(),
                user.getMobileNumber(),
                user.getPrcNumber(),
                user.getProfileImageUrl(),
                user.getStatus().name(),
                primaryOrganization != null ? primaryOrganization.id() : null,
                primaryOrganization != null ? primaryOrganization.name() : null,
                organizations,
                user.getRoles()
                        .stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet())
        );
    }

    private List<UserOrganizationResponse> organizationResponses(UserEntity user) {
        List<UserOrganizationResponse> organizations = user.getOrganizationMemberships()
                .stream()
                .sorted(Comparator.comparing(membership -> membership.getOrganization().getName()))
                .map(membership -> new UserOrganizationResponse(
                        membership.getOrganization().getId(),
                        membership.getOrganization().getName(),
                        membership.getOrganization().getCode(),
                        membership.getStatus().name()
                ))
                .toList();

        if (!organizations.isEmpty() || user.getOrganization() == null) {
            return organizations;
        }

        return List.of(new UserOrganizationResponse(
                user.getOrganization().getId(),
                user.getOrganization().getName(),
                user.getOrganization().getCode(),
                UserOrganizationStatus.CONFIRMED.name()
        ));
    }

    private String validatePrcNumber(String prcNumber) {
        String normalized = trimToNull(prcNumber);
        if (normalized != null && !normalized.matches("\\d{7}")) {
            throw new RuntimeException("PRC number must be a 7-digit license number");
        }

        return normalized;
    }

    private String validateMobileNumber(String mobileNumber) {
        String normalized = trimToNull(mobileNumber);
        if (normalized != null && !normalized.matches("^(09\\d{9}|\\+639\\d{9})$")) {
            throw new RuntimeException(MOBILE_NUMBER_MESSAGE);
        }

        return normalized;
    }

    private String resolveProfilePictureExtension(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !contentType.toLowerCase(Locale.ROOT).startsWith("image/")) {
            throw new RuntimeException("Profile picture must be an image file");
        }

        String extension = extensionFromFilename(file.getOriginalFilename());
        if (extension == null) {
            extension = extensionFromContentType(contentType);
        }

        if (extension == null || !ALLOWED_PROFILE_PICTURE_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Profile picture must be a JPG, PNG, WEBP, or GIF image");
        }

        return extension.equals("jpeg") ? "jpg" : extension;
    }

    private String extensionFromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }

        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == filename.length() - 1) {
            return null;
        }

        return filename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
    }

    private String extensionFromContentType(String contentType) {
        return switch (contentType.toLowerCase(Locale.ROOT)) {
            case "image/jpeg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/gif" -> "gif";
            default -> null;
        };
    }

    private void deletePreviousProfilePicture(String previousUrl, Path uploadDir) {
        if (previousUrl == null || !previousUrl.startsWith(PROFILE_PICTURE_URL_PREFIX)) {
            return;
        }

        try {
            Path previousPath = uploadDir.resolve(previousUrl.substring(PROFILE_PICTURE_URL_PREFIX.length())).normalize();
            if (previousPath.startsWith(uploadDir)) {
                Files.deleteIfExists(previousPath);
            }
        } catch (IOException ignored) {
            // A stale old image should not fail an otherwise successful upload.
        }
    }

    private String joinName(String firstName, String middleName, String lastName) {
        return List.of(firstName, middleName == null ? "" : middleName, lastName)
                .stream()
                .filter(name -> !name.isBlank())
                .collect(Collectors.joining(" "));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }
}
