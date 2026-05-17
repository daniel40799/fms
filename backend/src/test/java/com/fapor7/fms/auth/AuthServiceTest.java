package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserRepository;
import com.fapor7.fms.users.UserStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

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
}
