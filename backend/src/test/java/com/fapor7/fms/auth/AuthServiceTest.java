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

import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
                "ACTIVE",
                request.organizationId(),
                "Organization 4",
                Set.of("END_USER")
        );
        when(userService.create(org.mockito.ArgumentMatchers.any(UserCreateRequest.class))).thenReturn(expected);

        UserResponse response = authService.register(request);

        assertThat(response).isSameAs(expected);

        ArgumentCaptor<UserCreateRequest> captor = ArgumentCaptor.forClass(UserCreateRequest.class);
        verify(userService).create(captor.capture());
        assertThat(captor.getValue().email()).isEqualTo("new@example.test");
        assertThat(captor.getValue().password()).isEqualTo("secret");
        assertThat(captor.getValue().fullName()).isEqualTo("New User");
        assertThat(captor.getValue().organizationId()).isEqualTo(TestData.uuid(4));
        assertThat(captor.getValue().roles()).isNull();
    }
}
