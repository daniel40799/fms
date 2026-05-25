package com.fapor7.fms.users;

import com.fapor7.fms.TestData;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.roles.RoleRepository;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserOrganizationUpdateRequest;
import com.fapor7.fms.users.dto.UserProfileUpdateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.time.LocalDate;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    @Test
    void findAllMapsUsers() {
        UserEntity user = TestData.user(1, "admin@example.test", "Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);
        user.setOrganization(TestData.organization(2));
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> responses = userService.findAll();

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().organizationName()).isEqualTo("Organization 2");
        assertThat(responses.getFirst().roles()).containsExactly("MAIN_ADMIN");
    }

    @Test
    void findAllScopesOrganizationAdministratorToOwnAndUnaffiliatedEndUsers() {
        OrganizationEntity organization = TestData.organization(2);
        UserEntity organizationAdmin = TestData.user(
                10,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        );
        organizationAdmin.setOrganization(organization);

        UserEntity ownEndUser = TestData.activeUser(1);
        ownEndUser.setOrganization(organization);
        UserEntity unaffiliatedEndUser = TestData.activeUser(2);
        UserEntity otherEndUser = TestData.activeUser(3);
        otherEndUser.setOrganization(TestData.organization(3));
        UserEntity ownUserAdmin = TestData.user(4, "user-admin@example.test", "User Admin", UserStatus.ACTIVE, RoleName.USER_ADMIN);
        ownUserAdmin.setOrganization(organization);
        when(userRepository.findAll()).thenReturn(List.of(ownEndUser, unaffiliatedEndUser, otherEndUser, ownUserAdmin));

        List<UserResponse> responses = userService.findAll(TestData.principal(organizationAdmin));

        assertThat(responses)
                .extracting(UserResponse::email)
                .containsExactly(ownEndUser.getEmail(), unaffiliatedEndUser.getEmail());
    }

    @Test
    void findAllReturnsAllUsersForUserAdministrators() {
        UserEntity userAdmin = TestData.user(10, "user-admin@example.test", "User Admin", UserStatus.ACTIVE, RoleName.USER_ADMIN);
        UserEntity user = TestData.activeUser(1);
        when(userRepository.findAll()).thenReturn(List.of(user));

        List<UserResponse> responses = userService.findAll(TestData.principal(userAdmin));

        assertThat(responses).extracting(UserResponse::email).containsExactly(user.getEmail());
    }

    @Test
    void findAllRejectsOrganizationAdministratorWithoutOrganization() {
        UserEntity organizationAdmin = TestData.user(
                10,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        );

        assertThatThrownBy(() -> userService.findAll(TestData.principal(organizationAdmin)))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Organization administrator must be assigned to an organization");
    }

    @Test
    void createSavesUserWithExplicitRolesAndOrganization() {
        OrganizationEntity organization = TestData.organization(3);
        UserCreateRequest request = new UserCreateRequest(
                "new@example.test",
                "secret",
                "New User",
                organization.getId(),
                Set.of(RoleName.USER_ADMIN, RoleName.EVENT_ADMIN)
        );
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(roleRepository.findByName(RoleName.USER_ADMIN)).thenReturn(Optional.of(TestData.role(RoleName.USER_ADMIN)));
        when(roleRepository.findByName(RoleName.EVENT_ADMIN)).thenReturn(Optional.of(TestData.role(RoleName.EVENT_ADMIN)));
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.create(request);

        assertThat(response.email()).isEqualTo("new@example.test");
        assertThat(response.organizationId()).isEqualTo(organization.getId());
        assertThat(response.roles()).containsExactlyInAnyOrder("USER_ADMIN", "EVENT_ADMIN");
    }

    @Test
    void createUsesDefaultRoleWhenRolesAreMissing() {
        UserCreateRequest request = new UserCreateRequest("new@example.test", "secret", "New User", null, null);
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.END_USER)).thenReturn(Optional.of(TestData.role(RoleName.END_USER)));
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.create(request);

        assertThat(response.organizationId()).isNull();
        assertThat(response.organizationName()).isNull();
        assertThat(response.roles()).containsExactly("END_USER");
    }

    @Test
    void createUsesDefaultRoleWhenRolesAreEmpty() {
        UserCreateRequest request = new UserCreateRequest("new@example.test", "secret", "New User", null, Set.of());
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.END_USER)).thenReturn(Optional.of(TestData.role(RoleName.END_USER)));
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = userService.create(request);

        assertThat(response.roles()).containsExactly("END_USER");
    }

    @Test
    void createRejectsDuplicateEmail() {
        UserCreateRequest request = new UserCreateRequest("used@example.test", "secret", "Used", null, null);
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(TestData.activeUser(1)));

        assertThatThrownBy(() -> userService.create(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Email already exists");
    }

    @Test
    void createRejectsMissingOrganization() {
        UserCreateRequest request = new UserCreateRequest("new@example.test", "secret", "New", TestData.uuid(99), null);
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(organizationRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.create(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Organization not found");
    }

    @Test
    void createRejectsMissingExplicitRole() {
        UserCreateRequest request = new UserCreateRequest("new@example.test", "secret", "New", null, Set.of(RoleName.MAIN_ADMIN));
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.MAIN_ADMIN)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.create(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Role not found: MAIN_ADMIN");
    }

    @Test
    void createRejectsMissingDefaultRole() {
        UserCreateRequest request = new UserCreateRequest("new@example.test", "secret", "New", null, null);
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.END_USER)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.create(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Default role not found");
    }

    @Test
    void importCsvCreatesUsersWithOrganizationCodesAndRoles() {
        OrganizationEntity organization = TestData.organization(3);
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "users.csv",
                "text/csv",
                """
                        fullName,email,password,organizationCode,roles
                        "Imported, User",imported@example.test,secret,ORG-3,END_USER|EVENT_ADMIN
                        """.getBytes()
        );
        when(userRepository.findByEmail("imported@example.test")).thenReturn(Optional.empty());
        when(organizationRepository.findByCode("ORG-3")).thenReturn(Optional.of(organization));
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(roleRepository.findByName(RoleName.END_USER)).thenReturn(Optional.of(TestData.role(RoleName.END_USER)));
        when(roleRepository.findByName(RoleName.EVENT_ADMIN)).thenReturn(Optional.of(TestData.role(RoleName.EVENT_ADMIN)));
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<UserResponse> responses = userService.importCsv(file);

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().fullName()).isEqualTo("Imported, User");
        assertThat(responses.getFirst().organizationId()).isEqualTo(organization.getId());
        assertThat(responses.getFirst().roles()).containsExactlyInAnyOrder("END_USER", "EVENT_ADMIN");
    }

    @Test
    void importCsvRejectsUnknownRolesWithRowNumber() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "users.csv",
                "text/csv",
                """
                        fullName,email,password,roles
                        Imported User,imported@example.test,secret,UNKNOWN
                        """.getBytes()
        );

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV row 2 has unknown role: UNKNOWN");
    }

    @Test
    void importCsvRejectsEmptyFiles() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", new byte[0]);

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV file is required");
    }

    @Test
    void importCsvRejectsFilesWithoutRecords() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", "\r".getBytes());

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV file has no user rows");
    }

    @Test
    void importCsvRejectsHeaderWithoutRows() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", "fullName,email,password\n".getBytes());

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV file has no user rows");
    }

    @Test
    void importCsvSkipsBlankRows() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "users.csv",
                "text/csv",
                "fullName,email,password\n\nImported User,imported@example.test,secret\n".getBytes()
        );
        when(userRepository.findByEmail("imported@example.test")).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.END_USER)).thenReturn(Optional.of(TestData.role(RoleName.END_USER)));
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        assertThat(userService.importCsv(file)).hasSize(1);
    }

    @Test
    void importCsvReadsEscapedQuotesFinalRecordAndBlankRoleTokens() {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "users.csv",
                "text/csv",
                "fullName,email,password,roles\n\"Imported \"\"Quoted\"\" User\",quoted@example.test,secret,\" | EVENT_ADMIN\"".getBytes()
        );
        when(userRepository.findByEmail("quoted@example.test")).thenReturn(Optional.empty());
        when(roleRepository.findByName(RoleName.EVENT_ADMIN)).thenReturn(Optional.of(TestData.role(RoleName.EVENT_ADMIN)));
        when(passwordEncoder.encode("secret")).thenReturn("encoded");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<UserResponse> responses = userService.importCsv(file);

        assertThat(responses.getFirst().fullName()).isEqualTo("Imported \"Quoted\" User");
        assertThat(responses.getFirst().organizationId()).isNull();
        assertThat(responses.getFirst().roles()).containsExactly("EVENT_ADMIN");
    }

    @Test
    void importCsvRejectsUnterminatedQuotedValues() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", "fullName,email,password\n\"Broken".getBytes());

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV file has an unterminated quoted value");
    }

    @Test
    void importCsvRejectsMissingRequiredColumns() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", "name,email,password\nUser,user@example.test,secret".getBytes());

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV column is required: fullname");
    }

    @Test
    void importCsvRejectsRowsWithMissingRequiredValues() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", "fullName,email,password\n,user@example.test,secret".getBytes());

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("CSV row 2 is missing fullName");
    }

    @Test
    void importCsvWrapsFileReadErrors() throws IOException {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getBytes()).thenThrow(new IOException("read failed"));

        assertThatThrownBy(() -> userService.importCsv(file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to read CSV file");
    }

    @Test
    void updateProfileSavesCurrentUsersTrimmedName() {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateProfile(
                TestData.principal(user),
                profileRequest("  Updated User  ")
        );

        assertThat(user.getFullName()).isEqualTo("Updated User");
        assertThat(user.getUpdatedAt()).isNotNull();
        assertThat(response.fullName()).isEqualTo("Updated User");
    }

    @Test
    void updateProfileRejectsBlankName() {
        assertThatThrownBy(() -> userService.updateProfile(
                TestData.principal(TestData.activeUser(1)),
                profileRequest(" ")
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Full name is required");
    }

    @Test
    void updateProfileStoresDetailedIdentityFieldsAndBuildsFullName() {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateProfile(
                TestData.principal(user),
                new UserProfileUpdateRequest(
                        null,
                        " Daniel ",
                        null,
                        " Dalaota ",
                        LocalDate.of(1990, 2, 3),
                        " Male ",
                        " Cebu City ",
                        " +639171234567 ",
                        "1234567"
                )
        );

        assertThat(response.fullName()).isEqualTo("Daniel Dalaota");
        assertThat(response.firstName()).isEqualTo("Daniel");
        assertThat(response.birthday()).isEqualTo(LocalDate.of(1990, 2, 3));
        assertThat(response.address()).isEqualTo("Cebu City");
        assertThat(response.prcNumber()).isEqualTo("1234567");
    }

    @Test
    void updateProfileRejectsPartialStructuredName() {
        assertThatThrownBy(() -> userService.updateProfile(
                TestData.principal(TestData.activeUser(1)),
                new UserProfileUpdateRequest(null, "First", null, null, null, null, null, null, null)
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("First and last names are required");
    }

    @Test
    void updateProfileRejectsInvalidPrcNumber() {
        assertThatThrownBy(() -> userService.updateProfile(
                TestData.principal(TestData.activeUser(1)),
                new UserProfileUpdateRequest("User", null, null, null, null, null, null, null, "ABC")
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("PRC number must be a 7-digit license number");
    }

    @Test
    void updateProfileRejectsInvalidMobileNumber() {
        assertThatThrownBy(() -> userService.updateProfile(
                TestData.principal(TestData.activeUser(1)),
                new UserProfileUpdateRequest("User", null, null, null, null, null, null, "0917123456", null)
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Mobile number must be in 09XXXXXXXXX or +639XXXXXXXXX format.");
    }

    @Test
    void updateProfilePictureStoresImageUrlAndDeletesPreviousImage() throws IOException {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.save(user)).thenReturn(user);

        UserResponse firstResponse = userService.updateProfilePicture(
                TestData.principal(user),
                new MockMultipartFile("file", "avatar.jpeg", "image/jpeg", "first".getBytes())
        );
        Path firstPath = pathFromProfileImageUrl(firstResponse.profileImageUrl());

        assertThat(firstResponse.profileImageUrl()).startsWith("/uploads/profile-pictures/");
        assertThat(firstResponse.profileImageUrl()).endsWith(".jpg");
        assertThat(Files.exists(firstPath)).isTrue();

        UserResponse secondResponse = userService.updateProfilePicture(
                TestData.principal(user),
                new MockMultipartFile("file", "avatar.png", "image/png", "second".getBytes())
        );
        Path secondPath = pathFromProfileImageUrl(secondResponse.profileImageUrl());

        assertThat(Files.exists(firstPath)).isFalse();
        assertThat(Files.exists(secondPath)).isTrue();
        Files.deleteIfExists(secondPath);
    }

    @Test
    void updateProfilePictureFallsBackToContentTypeWhenFilenameHasNoExtension() throws IOException {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateProfilePicture(
                TestData.principal(user),
                new MockMultipartFile("file", "avatar", "image/png", "image".getBytes())
        );

        assertThat(response.profileImageUrl()).endsWith(".png");
        Files.deleteIfExists(pathFromProfileImageUrl(response.profileImageUrl()));
    }

    @Test
    void updateProfilePictureUsesContentTypeForBlankFilenames() throws IOException {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.save(user)).thenReturn(user);

        for (String[] imageType : List.of(
                new String[]{"image/jpeg", ".jpg"},
                new String[]{"image/webp", ".webp"},
                new String[]{"image/gif", ".gif"}
        )) {
            UserResponse response = userService.updateProfilePicture(
                    TestData.principal(user),
                    new MockMultipartFile("file", "", imageType[0], "image".getBytes())
            );

            assertThat(response.profileImageUrl()).endsWith(imageType[1]);
            Files.deleteIfExists(pathFromProfileImageUrl(response.profileImageUrl()));
            user.setProfileImageUrl(null);
        }
    }

    @Test
    void updateProfilePictureIgnoresPreviousImageCleanupErrors() throws IOException {
        UserEntity user = TestData.activeUser(1);
        Path staleDirectory = Path.of("uploads", "profile-pictures", "stale-directory");
        Files.createDirectories(staleDirectory);
        Files.writeString(staleDirectory.resolve("nested.txt"), "stale");
        user.setProfileImageUrl("/uploads/profile-pictures/stale-directory");
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateProfilePicture(
                TestData.principal(user),
                new MockMultipartFile("file", "avatar.png", "image/png", "image".getBytes())
        );

        assertThat(response.profileImageUrl()).endsWith(".png");
        Files.deleteIfExists(pathFromProfileImageUrl(response.profileImageUrl()));
        Files.deleteIfExists(staleDirectory.resolve("nested.txt"));
        Files.deleteIfExists(staleDirectory);
    }

    @Test
    void updateProfilePictureRejectsMissingFile() {
        assertThatThrownBy(() -> userService.updateProfilePicture(
                TestData.principal(TestData.activeUser(1)),
                new MockMultipartFile("file", "avatar.png", "image/png", new byte[0])
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Profile picture is required");
    }

    @Test
    void updateProfilePictureRejectsOversizedFile() {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(5L * 1024L * 1024L + 1L);

        assertThatThrownBy(() -> userService.updateProfilePicture(TestData.principal(TestData.activeUser(1)), file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Profile picture must be 5 MB or smaller");
    }

    @Test
    void updateProfilePictureRejectsNonImageContentType() {
        assertThatThrownBy(() -> userService.updateProfilePicture(
                TestData.principal(TestData.activeUser(1)),
                new MockMultipartFile("file", "avatar.txt", "text/plain", "text".getBytes())
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Profile picture must be an image file");
    }

    @Test
    void updateProfilePictureRejectsUnsupportedImageExtension() {
        assertThatThrownBy(() -> userService.updateProfilePicture(
                TestData.principal(TestData.activeUser(1)),
                new MockMultipartFile("file", "avatar", "image/svg+xml", "<svg />".getBytes())
        ))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Profile picture must be a JPG, PNG, WEBP, or GIF image");
    }

    @Test
    void updateProfilePictureWrapsStorageErrors() throws IOException {
        MultipartFile file = org.mockito.Mockito.mock(MultipartFile.class);
        when(file.isEmpty()).thenReturn(false);
        when(file.getSize()).thenReturn(12L);
        when(file.getContentType()).thenReturn("image/png");
        when(file.getOriginalFilename()).thenReturn("avatar.png");
        when(file.getInputStream()).thenThrow(new IOException("disk full"));

        assertThatThrownBy(() -> userService.updateProfilePicture(TestData.principal(TestData.activeUser(1)), file))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to upload profile picture");
    }

    @Test
    void updateOrganizationLetsOrganizationAdminAssignOwnOrganization() {
        OrganizationEntity organization = TestData.organization(2);
        UserEntity organizationAdmin = TestData.user(
                10,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        );
        organizationAdmin.setOrganization(organization);
        UserEntity user = TestData.activeUser(1);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(userRepository.save(user)).thenReturn(user);

        UserResponse response = userService.updateOrganization(
                user.getId(),
                new UserOrganizationUpdateRequest(organization.getId()),
                TestData.principal(organizationAdmin)
        );

        assertThat(user.getOrganization()).isSameAs(organization);
        assertThat(response.organizationId()).isEqualTo(organization.getId());
    }

    @Test
    void updateOrganizationRejectsOrganizationAdminForAnotherOrganizationsUser() {
        OrganizationEntity organization = TestData.organization(2);
        UserEntity organizationAdmin = TestData.user(
                10,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        );
        organizationAdmin.setOrganization(organization);
        UserEntity user = TestData.activeUser(1);
        user.setOrganization(TestData.organization(3));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.updateOrganization(
                user.getId(),
                new UserOrganizationUpdateRequest(null),
                TestData.principal(organizationAdmin)
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Cannot manage another organization's users");
    }

    @Test
    void updateOrganizationRejectsOrganizationAdminAssigningAnotherOrganization() {
        OrganizationEntity currentOrganization = TestData.organization(2);
        OrganizationEntity requestedOrganization = TestData.organization(3);
        UserEntity organizationAdmin = TestData.user(
                10,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        );
        organizationAdmin.setOrganization(currentOrganization);
        UserEntity user = TestData.activeUser(1);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(organizationRepository.findById(requestedOrganization.getId())).thenReturn(Optional.of(requestedOrganization));

        assertThatThrownBy(() -> userService.updateOrganization(
                user.getId(),
                new UserOrganizationUpdateRequest(requestedOrganization.getId()),
                TestData.principal(organizationAdmin)
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Cannot assign users to another organization");
    }

    @Test
    void updateOrganizationRejectsNonEndUserAffiliations() {
        UserEntity userAdmin = TestData.user(1, "user-admin@example.test", "User Admin", UserStatus.ACTIVE, RoleName.USER_ADMIN);
        UserEntity mainAdmin = TestData.user(2, "main-admin@example.test", "Main Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);
        when(userRepository.findById(userAdmin.getId())).thenReturn(Optional.of(userAdmin));

        assertThatThrownBy(() -> userService.updateOrganization(
                userAdmin.getId(),
                new UserOrganizationUpdateRequest(null),
                TestData.principal(mainAdmin)
        ))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessage("Only end-user affiliations can be managed");
    }

    @Test
    void deleteRemovesUser() {
        UserEntity administrator = TestData.user(1, "admin@example.test", "Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);
        UserEntity user = TestData.activeUser(2);
        when(userRepository.findById(TestData.uuid(2))).thenReturn(Optional.of(user));

        userService.delete(TestData.uuid(2), TestData.principal(administrator));

        verify(userRepository).delete(user);
    }

    @Test
    void deleteRejectsCurrentUser() {
        UserEntity administrator = TestData.user(1, "admin@example.test", "Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);

        assertThatThrownBy(() -> userService.delete(TestData.uuid(1), TestData.principal(administrator)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("You cannot delete your own account");
    }

    @Test
    void deleteRejectsMissingUser() {
        UserEntity administrator = TestData.user(1, "admin@example.test", "Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);
        when(userRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.delete(TestData.uuid(99), TestData.principal(administrator)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User not found");
    }

    private static UserProfileUpdateRequest profileRequest(String fullName) {
        return new UserProfileUpdateRequest(fullName, null, null, null, null, null, null, null, null);
    }

    private static Path pathFromProfileImageUrl(String profileImageUrl) {
        return Path.of(profileImageUrl.substring(1));
    }
}
