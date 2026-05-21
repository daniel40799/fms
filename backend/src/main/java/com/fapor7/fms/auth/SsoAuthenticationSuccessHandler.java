package com.fapor7.fms.auth;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Bridges provider OIDC login back into the frontend JWT session flow.
 */
@Component
public class SsoAuthenticationSuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;
    private final String frontendSuccessUri;

    public SsoAuthenticationSuccessHandler(
            AuthService authService,
            @Value("${app.sso.frontend-success-uri:http://127.0.0.1:5173/}") String frontendSuccessUri
    ) {
        this.authService = authService;
        this.frontendSuccessUri = frontendSuccessUri;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException, ServletException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        LoginResponse login = authService.loginSso(oauthToken.getPrincipal());
        String encodedToken = URLEncoder.encode(login.token(), StandardCharsets.UTF_8);
        response.sendRedirect(frontendSuccessUri + "#sso_token=" + encodedToken);
    }
}
