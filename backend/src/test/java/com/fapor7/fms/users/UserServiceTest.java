package com.fapor7.fms.users;

import com.fapor7.fms.TestData;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.roles.RoleRepository;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
}
