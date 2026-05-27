package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserRepository;
import com.fapor7.fms.users.UserService;
import com.fapor7.fms.users.UserStatus;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserService userService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private TwoFactorService twoFactorService;

    @InjectMocks
    private AuthService authService;

    @Test
    void loginReturnsTokenForActiveUserWithMatchingPassword() {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("secret", user.getPasswordHash())).thenReturn(true);
        when(jwtService.generateToken(user.getId(), user.getEmail())).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest(user.getEmail(), "secret"));

        assertThat(response.token()).isEqualTo("jwt-token");
        verify(jwtService).generateToken(user.getId(), user.getEmail());
    }

    @Test
    void loginRejectsUnknownEmail() {
        when(userRepository.findByEmail("missing@example.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("missing@example.test", "secret")))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void loginRejectsInactiveUser() {
        UserEntity user = TestData.user(2, "inactive@example.test", "Inactive", UserStatus.INACTIVE);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "secret")))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User account is not active");
    }

    @Test
    void loginRejectsBadPassword() {
        UserEntity user = TestData.activeUser(3);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong", user.getPasswordHash())).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new LoginRequest(user.getEmail(), "wrong")))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    void registerCreatesDefaultEndUserAccountWithoutToken() {
        RegisterRequest request = new RegisterRequest(
                "New User",
                "new@example.test",
                "secret",
                TestData.uuid(4)
        );
        UserResponse expected = new UserResponse(
                TestData.uuid(5),
                request.email(),
                request.fullName(),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                "ACTIVE",
                request.organizationId(),
                "Organization 4",
                Set.of("END_USER")
        );
        when(userService.createPendingEndUser(org.mockito.ArgumentMatchers.any(UserCreateRequest.class))).thenReturn(expected);

        UserResponse response = authService.register(request);

        assertThat(response).isSameAs(expected);

        ArgumentCaptor<UserCreateRequest> captor = ArgumentCaptor.forClass(UserCreateRequest.class);
        verify(userService).createPendingEndUser(captor.capture());
        assertThat(captor.getValue().email()).isEqualTo("new@example.test");
        assertThat(captor.getValue().password()).isEqualTo("secret");
        assertThat(captor.getValue().fullName()).isEqualTo("New User");
        assertThat(captor.getValue().organizationId()).isEqualTo(TestData.uuid(4));
        assertThat(captor.getValue().roles()).isNull();
    }

    @Test
    void loginSsoReturnsTokenForExistingEmail() {
        UserEntity user = TestData.activeUser(6);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(oauth2User.getAttributes()).thenReturn(java.util.Map.of("email", user.getEmail()));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));
        when(jwtService.generateToken(user.getId(), user.getEmail())).thenReturn("sso-token");

        LoginResponse response = authService.loginSso(oauth2User);

        assertThat(response.token()).isEqualTo("sso-token");
    }

    @Test
    void loginSsoRejectsProviderWithoutEmail() {
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(oauth2User.getAttributes()).thenReturn(java.util.Map.of());

        assertThatThrownBy(() -> authService.loginSso(oauth2User))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("SSO provider did not return an email address");
    }

    @Test
    void loginSsoRejectsInactiveUsers() {
        UserEntity user = TestData.user(9, "inactive-sso@example.test", "Inactive SSO", UserStatus.INACTIVE);
        OAuth2User oauth2User = mock(OAuth2User.class);
        when(oauth2User.getAttributes()).thenReturn(java.util.Map.of("email", user.getEmail()));
        when(userRepository.findByEmailIgnoreCase(user.getEmail())).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.loginSso(oauth2User))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User account is not active");
    }

    @Test
    void loginSsoProvisionsMissingEmailAsEndUser() {
        OAuth2User oauth2User = mock(OAuth2User.class);
        UserEntity user = TestData.activeUser(7);
        when(oauth2User.getAttributes()).thenReturn(java.util.Map.of(
                "preferred_username", "SSO.User@example.test",
                "name", "SSO User"
        ));
        when(userRepository.findByEmailIgnoreCase("sso.user@example.test"))
                .thenReturn(Optional.empty(), Optional.of(user));
        when(jwtService.generateToken(user.getId(), user.getEmail())).thenReturn("sso-token");

        LoginResponse response = authService.loginSso(oauth2User);

        assertThat(response.token()).isEqualTo("sso-token");
        ArgumentCaptor<UserCreateRequest> captor = ArgumentCaptor.forClass(UserCreateRequest.class);
        verify(userService).create(captor.capture());
        assertThat(captor.getValue().email()).isEqualTo("sso.user@example.test");
        assertThat(captor.getValue().fullName()).isEqualTo("SSO User");
        assertThat(captor.getValue().roles()).isNull();
    }
}
