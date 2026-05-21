package com.fapor7.fms.users;

import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.roles.RoleEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.roles.RoleRepository;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserOrganizationUpdateRequest;
import com.fapor7.fms.users.dto.UserProfileUpdateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import com.fapor7.fms.auth.AuthenticatedUser;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
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

        UUID organizationId = requireOrganizationAdminOrganization(currentUser).getId();

        return userRepository.findAll()
                .stream()
                .filter(this::isEndUser)
                .filter(user -> user.getOrganization() == null
                        || user.getOrganization().getId().equals(organizationId))
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
        user.setMobileNumber(trimToNull(request.mobileNumber()));
        user.setPrcNumber(validatePrcNumber(request.prcNumber()));
        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
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
        UserEntity user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!isEndUser(user)) {
            throw new AccessDeniedException("Only end-user affiliations can be managed");
        }

        OrganizationEntity organization = null;

        if (request.organizationId() != null) {
            organization = organizationRepository.findById(request.organizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
        }

        UserEntity currentUser = authenticatedUser.getUser();

        if (!canManageAllUsers(currentUser)) {
            OrganizationEntity currentOrganization = requireOrganizationAdminOrganization(currentUser);
            enforceOrganizationAdminAffiliationScope(user, organization, currentOrganization);
        }

        user.setOrganization(organization);
        user.setUpdatedAt(LocalDateTime.now());

        return toResponse(userRepository.save(user));
    }

    private boolean canManageAllUsers(UserEntity user) {
        return hasRole(user, RoleName.MAIN_ADMIN) || hasRole(user, RoleName.USER_ADMIN);
    }

    private OrganizationEntity requireOrganizationAdminOrganization(UserEntity user) {
        if (!hasRole(user, RoleName.ORGANIZATION_ADMIN) || user.getOrganization() == null) {
            throw new AccessDeniedException("Organization administrator must be assigned to an organization");
        }

        return user.getOrganization();
    }

    private void enforceOrganizationAdminAffiliationScope(
            UserEntity user,
            OrganizationEntity requestedOrganization,
            OrganizationEntity currentOrganization
    ) {
        UUID currentOrganizationId = currentOrganization.getId();

        if (user.getOrganization() != null
                && !user.getOrganization().getId().equals(currentOrganizationId)) {
            throw new AccessDeniedException("Cannot manage another organization's users");
        }

        if (requestedOrganization != null
                && !requestedOrganization.getId().equals(currentOrganizationId)) {
            throw new AccessDeniedException("Cannot assign users to another organization");
        }
    }

    private boolean isEndUser(UserEntity user) {
        return hasRole(user, RoleName.END_USER);
    }

    private boolean hasRole(UserEntity user, RoleName roleName) {
        return user.getRoles()
                .stream()
                .anyMatch(role -> role.getName() == roleName);
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
                user.getStatus().name(),
                user.getOrganization() != null ? user.getOrganization().getId() : null,
                user.getOrganization() != null ? user.getOrganization().getName() : null,
                user.getRoles()
                        .stream()
                        .map(role -> role.getName().name())
                        .collect(Collectors.toSet())
        );
    }

    private String validatePrcNumber(String prcNumber) {
        String normalized = trimToNull(prcNumber);
        if (normalized != null && !normalized.matches("\\d{7}")) {
            throw new RuntimeException("PRC number must be a 7-digit license number");
        }

        return normalized;
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
