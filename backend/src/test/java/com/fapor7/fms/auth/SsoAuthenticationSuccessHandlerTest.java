package com.fapor7.fms.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class SsoAuthenticationSuccessHandlerTest {

    @Test
    void redirectsProviderAuthenticationToFrontendSessionToken() throws Exception {
        AuthService authService = mock(AuthService.class);
        SsoAuthenticationSuccessHandler handler = new SsoAuthenticationSuccessHandler(
                authService,
                "http://frontend.example.test/"
        );
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);
        OAuth2AuthenticationToken authentication = mock(OAuth2AuthenticationToken.class);
        OAuth2User principal = mock(OAuth2User.class);
        when(authentication.getPrincipal()).thenReturn(principal);
        when(authService.loginSso(principal)).thenReturn(new LoginResponse("JWT token"));

        handler.onAuthenticationSuccess(request, response, authentication);

        verify(response).sendRedirect("http://frontend.example.test/#sso_token=JWT+token");
    }
}
