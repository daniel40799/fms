package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CustomUserDetailsServiceTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final CustomUserDetailsService service = new CustomUserDetailsService(userRepository);

    @Test
    void loadUserByUsernameReturnsAuthenticatedUser() {
        UserEntity user = TestData.activeUser(1);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername(user.getEmail());

        assertThat(details).isInstanceOf(AuthenticatedUser.class);
        assertThat(((AuthenticatedUser) details).getUser()).isSameAs(user);
    }

    @Test
    void loadUserByUsernameThrowsWhenEmailIsMissing() {
        when(userRepository.findByEmail("missing@example.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("missing@example.test"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found");
    }

    @Test
    void loadUserByIdReturnsAuthenticatedUser() {
        UserEntity user = TestData.activeUser(2);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserById(user.getId());

        assertThat(details).isInstanceOf(AuthenticatedUser.class);
        assertThat(((AuthenticatedUser) details).getUser()).isSameAs(user);
    }

    @Test
    void loadUserByIdThrowsWhenIdIsMissing() {
        when(userRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserById(TestData.uuid(99)))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessage("User not found");
    }
}
