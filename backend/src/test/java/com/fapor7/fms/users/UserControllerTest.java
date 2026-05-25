package com.fapor7.fms.users;

import com.fapor7.fms.TestData;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserOrganizationUpdateRequest;
import com.fapor7.fms.users.dto.UserProfileUpdateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserControllerTest {

    private final UserService userService = mock(UserService.class);
    private final UserController controller = new UserController(userService);

    @Test
    void meReturnsProfileWithOrganizationAndRoles() {
        OrganizationEntity organization = TestData.organization(2);
        UserEntity user = TestData.user(1, "admin@example.test", "Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);
        user.setOrganization(organization);
        user.setProfileImageUrl("/uploads/profile-pictures/admin.png");

        Map<String, Object> profile = controller.me(TestData.principal(user));

        assertThat(profile)
                .containsEntry("id", user.getId())
                .containsEntry("email", "admin@example.test")
                .containsEntry("fullName", "Admin")
                .containsEntry("firstName", null)
                .containsEntry("status", UserStatus.ACTIVE)
                .containsEntry("profileImageUrl", "/uploads/profile-pictures/admin.png")
                .containsEntry("organizationId", organization.getId())
                .containsEntry("organization", "Organization 2")
                .containsEntry("organizationCode", "ORG2");
        assertThat(profile.get("roles")).asList().containsExactly("MAIN_ADMIN");
    }

    @Test
    void meAllowsMissingOrganization() {
        UserEntity user = TestData.activeUser(1);

        Map<String, Object> profile = controller.me(TestData.principal(user));

        assertThat(profile)
                .containsEntry("organizationId", null)
                .containsEntry("organization", null);
    }

    @Test
    void findAllDelegatesToService() {
        var principal = TestData.principal(TestData.user(
                2,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        ));
        UserResponse response = response();
        when(userService.findAll(principal)).thenReturn(List.of(response));

        assertThat(controller.findAll(principal)).containsExactly(response);
    }

    @Test
    void createDelegatesToService() {
        UserCreateRequest request = new UserCreateRequest("user@example.test", "secret", "User", null, Set.of(RoleName.END_USER));
        UserResponse response = response();
        when(userService.create(request)).thenReturn(response);

        assertThat(controller.create(request)).isSameAs(response);
    }

    @Test
    void importCsvDelegatesToService() {
        MockMultipartFile file = new MockMultipartFile("file", "users.csv", "text/csv", new byte[0]);
        UserResponse response = response();
        when(userService.importCsv(file)).thenReturn(List.of(response));

        assertThat(controller.importCsv(file)).containsExactly(response);
    }

    @Test
    void updateMeDelegatesToService() {
        UserEntity user = TestData.activeUser(1);
        var principal = TestData.principal(user);
        UserProfileUpdateRequest request = new UserProfileUpdateRequest("Updated User", null, null, null, null, null, null, null, null);
        UserResponse response = response();
        when(userService.updateProfile(principal, request)).thenReturn(response);

        assertThat(controller.updateMe(request, principal)).isSameAs(response);
    }

    @Test
    void uploadProfilePictureDelegatesToService() {
        UserEntity user = TestData.activeUser(1);
        var principal = TestData.principal(user);
        MockMultipartFile file = new MockMultipartFile("file", "avatar.png", "image/png", "image".getBytes());
        UserResponse response = response();
        when(userService.updateProfilePicture(principal, file)).thenReturn(response);

        assertThat(controller.uploadProfilePicture(file, principal)).isSameAs(response);
    }

    @Test
    void updateOrganizationDelegatesToService() {
        var principal = TestData.principal(TestData.user(
                2,
                "org-admin@example.test",
                "Organization Admin",
                UserStatus.ACTIVE,
                RoleName.ORGANIZATION_ADMIN
        ));
        UserOrganizationUpdateRequest request = new UserOrganizationUpdateRequest(TestData.uuid(3));
        UserResponse response = response();
        when(userService.updateOrganization(TestData.uuid(1), request, principal)).thenReturn(response);

        assertThat(controller.updateOrganization(TestData.uuid(1), request, principal)).isSameAs(response);
    }

    @Test
    void deleteDelegatesToService() {
        var principal = TestData.principal(TestData.user(
                2,
                "admin@example.test",
                "Admin",
                UserStatus.ACTIVE,
                RoleName.MAIN_ADMIN
        ));

        controller.delete(TestData.uuid(1), principal);

        verify(userService).delete(TestData.uuid(1), principal);
    }

    private static UserResponse response() {
        return new UserResponse(
                TestData.uuid(1),
                "user@example.test",
                "User",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "ACTIVE",
                null,
                null,
                Set.of("END_USER")
        );
    }
}
