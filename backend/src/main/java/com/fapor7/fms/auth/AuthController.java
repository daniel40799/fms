package com.fapor7.fms.auth;

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
}
