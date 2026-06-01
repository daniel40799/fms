package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.users.dto.UserResponse;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

    @Test
    void verifyTwoFactorDelegatesToService() {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        VerifyTwoFactorRequest request = new VerifyTwoFactorRequest(TestData.uuid(3), "123456");
        LoginResponse expected = new LoginResponse("verified-token");
        when(authService.verifyTwoFactor(request)).thenReturn(expected);

        LoginResponse response = controller.verifyTwoFactor(request);

        assertThat(response).isSameAs(expected);
        assertThat(response.token()).isEqualTo("verified-token");
        assertThat(response.twoFactorRequired()).isFalse();
        verify(authService).verifyTwoFactor(request);
    }

    @Test
    void resendTwoFactorDelegatesToService() {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        ResendTwoFactorRequest request = new ResendTwoFactorRequest(TestData.uuid(4));
        LoginResponse expected = new LoginResponse(
                null,
                true,
                request.challengeId(),
                "EMAIL",
                "u***@example.test",
                LocalDateTime.of(2026, 1, 1, 10, 0)
        );
        when(authService.resendTwoFactor(request)).thenReturn(expected);

        LoginResponse response = controller.resendTwoFactor(request);

        assertThat(response).isSameAs(expected);
        assertThat(response.twoFactorRequired()).isTrue();
        assertThat(response.channel()).isEqualTo("EMAIL");
        assertThat(response.maskedDestination()).isEqualTo("u***@example.test");
        verify(authService).resendTwoFactor(request);
    }

    @Test
    void verifyTwoFactorReturnsStructuredAuthError() throws Exception {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new AuthExceptionHandler())
                .build();
        when(authService.verifyTwoFactor(org.mockito.ArgumentMatchers.any(VerifyTwoFactorRequest.class)))
                .thenThrow(AuthException.invalidVerificationCode());

        mockMvc.perform(post("/api/auth/2fa/verify")
                        .contentType("application/json")
                        .content("{\"challengeId\":\"00000000-0000-0000-0000-000000000003\",\"code\":\"000000\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_VERIFICATION_CODE"))
                .andExpect(jsonPath("$.message").value("Invalid or expired verification code."));
    }

    @Test
    void verifyTwoFactorRouteReturnsTokenResponseShape() throws Exception {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new AuthExceptionHandler())
                .build();
        when(authService.verifyTwoFactor(org.mockito.ArgumentMatchers.any(VerifyTwoFactorRequest.class)))
                .thenReturn(new LoginResponse("verified-token"));

        mockMvc.perform(post("/api/auth/2fa/verify")
                        .contentType("application/json")
                        .content("{\"challengeId\":\"00000000-0000-0000-0000-000000000003\",\"code\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("verified-token"))
                .andExpect(jsonPath("$.twoFactorRequired").value(false));
    }

    @Test
    void resendTwoFactorRouteReturnsChallengeResponseShape() throws Exception {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new AuthExceptionHandler())
                .build();
        when(authService.resendTwoFactor(org.mockito.ArgumentMatchers.any(ResendTwoFactorRequest.class)))
                .thenReturn(new LoginResponse(
                        null,
                        true,
                        TestData.uuid(4),
                        "SMS",
                        "*******4567",
                        LocalDateTime.of(2026, 1, 1, 10, 0)
                ));

        mockMvc.perform(post("/api/auth/2fa/resend")
                        .contentType("application/json")
                        .content("{\"challengeId\":\"00000000-0000-0000-0000-000000000004\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.twoFactorRequired").value(true))
                .andExpect(jsonPath("$.channel").value("SMS"))
                .andExpect(jsonPath("$.maskedDestination").value("*******4567"));
    }

    @Test
    void resendTwoFactorReturnsStructuredAuthError() throws Exception {
        AuthService authService = mock(AuthService.class);
        AuthController controller = new AuthController(authService);
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new AuthExceptionHandler())
                .build();
        when(authService.resendTwoFactor(org.mockito.ArgumentMatchers.any(ResendTwoFactorRequest.class)))
                .thenThrow(AuthException.verificationCooldown());

        mockMvc.perform(post("/api/auth/2fa/resend")
                        .contentType("application/json")
                        .content("{\"challengeId\":\"00000000-0000-0000-0000-000000000004\"}"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("VERIFICATION_COOLDOWN"))
                .andExpect(jsonPath("$.message").value("Please wait before requesting another verification code."));
    }

    @Test
    void loginValidationReturnsStructuredRequestError() throws Exception {
        AuthController controller = new AuthController(mock(AuthService.class));
        MockMvc mockMvc = MockMvcBuilders
                .standaloneSetup(controller)
                .setControllerAdvice(new AuthExceptionHandler())
                .build();

        mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("{\"email\":\"not-an-email\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("INVALID_REQUEST"))
                .andExpect(jsonPath("$.message").value("Invalid request."));
    }
}
