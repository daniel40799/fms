package com.fapor7.fms.auth;

import com.fapor7.fms.users.dto.UserResponse;
import org.springframework.web.bind.annotation.*;

/**
 * Exposes authentication endpoints for clients that need a bearer token.
 *
 * <p>Current support is email/password login. Successful authentication returns
 * a JWT used by the frontend when calling protected FAPOR7 management APIs.</p>
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticates submitted credentials and returns a JWT on success.
     *
     * @param request email and password submitted by the user
     * @return bearer token response for authenticated API calls
     */
    @PostMapping("/login")
    public LoginResponse login(@RequestBody LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Verifies a pending login 2FA code and returns the normal JWT.
     *
     * @param request challenge id and submitted code
     * @return bearer token response
     */
    @PostMapping("/2fa/verify")
    public LoginResponse verifyTwoFactor(@RequestBody VerifyTwoFactorRequest request) {
        return authService.verifyTwoFactor(request);
    }

    /**
     * Resends a code for a pending login 2FA challenge.
     *
     * @param request challenge id
     * @return updated challenge response
     */
    @PostMapping("/2fa/resend")
    public LoginResponse resendTwoFactor(@RequestBody ResendTwoFactorRequest request) {
        return authService.resendTwoFactor(request);
    }

    /**
     * Creates a public end-user account without issuing a JWT.
     *
     * @param request self-registration payload
     * @return created user profile
     */
    @PostMapping("/register")
    public UserResponse register(@RequestBody RegisterRequest request) {
        return authService.register(request);
    }
}
