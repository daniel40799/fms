package com.fapor7.fms.users;

import com.fapor7.fms.TestData;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UserControllerTest {

    private final UserService userService = mock(UserService.class);
    private final UserController controller = new UserController(userService);

    @Test
    void meReturnsProfileWithOrganizationAndRoles() {
        OrganizationEntity organization = TestData.organization(2);
        UserEntity user = TestData.user(1, "admin@example.test", "Admin", UserStatus.ACTIVE, RoleName.MAIN_ADMIN);
        user.setOrganization(organization);

        Map<String, Object> profile = controller.me(TestData.principal(user));

        assertThat(profile)
                .containsEntry("id", user.getId())
                .containsEntry("email", "admin@example.test")
                .containsEntry("fullName", "Admin")
                .containsEntry("status", UserStatus.ACTIVE)
                .containsEntry("organization", "Organization 2");
        assertThat(profile.get("roles")).asList().containsExactly("MAIN_ADMIN");
    }

    @Test
    void meAllowsMissingOrganization() {
        UserEntity user = TestData.activeUser(1);

        Map<String, Object> profile = controller.me(TestData.principal(user));

        assertThat(profile).containsEntry("organization", null);
    }

    @Test
    void findAllDelegatesToService() {
        UserResponse response = response();
        when(userService.findAll()).thenReturn(List.of(response));

        assertThat(controller.findAll()).containsExactly(response);
    }

    @Test
    void createDelegatesToService() {
        UserCreateRequest request = new UserCreateRequest("user@example.test", "secret", "User", null, Set.of(RoleName.END_USER));
        UserResponse response = response();
        when(userService.create(request)).thenReturn(response);

        assertThat(controller.create(request)).isSameAs(response);
    }

    private static UserResponse response() {
        return new UserResponse(TestData.uuid(1), "user@example.test", "User", "ACTIVE", null, null, Set.of("END_USER"));
    }
}
