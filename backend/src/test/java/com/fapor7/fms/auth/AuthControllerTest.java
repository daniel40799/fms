package com.fapor7.fms.auth;

import org.junit.jupiter.api.Test;

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
}
