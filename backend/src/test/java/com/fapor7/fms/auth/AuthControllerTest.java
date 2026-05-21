package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthControllerTest {

    @Test
    void loginDelegatesToService() {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        LoginRequest request = new LoginRequest("user@example.test", "secret");
        LoginResponse expected = new LoginResponse("token");
        when(authService.login(request)).thenReturn(expected);

        LoginResponse response = controller.login(request);

        assertThat(response).isSameAs(expected);
        verify(authService).login(request);
    }

    @Test
    void registerDelegatesToService() {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        RegisterRequest request = new RegisterRequest("User", "user@example.test", "secret", TestData.uuid(1));
        UserResponse expected = new UserResponse(
                TestData.uuid(2),
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
                TestData.uuid(1),
                "Organization 1",
                Set.of("END_USER")
        );
        when(authService.register(request)).thenReturn(expected);

        UserResponse response = controller.register(request);

        assertThat(response).isSameAs(expected);
        verify(authService).register(request);
    }
}
