package com.fapor7.fms.auth;

import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserRepository;
import com.fapor7.fms.users.UserStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Handles email/password authentication and JWT issuance.
 *
 * <p>The service rejects unknown users, inactive accounts, and invalid
 * passwords before creating a token that identifies the user by UUID.</p>
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    /**
     * Validates login credentials and creates a bearer token.
     *
     * @param request submitted email and raw password
     * @return response containing a signed JWT
     * @throws RuntimeException when credentials are invalid or the account is inactive
     */
    public LoginResponse login(LoginRequest request) {
        UserEntity user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("User account is not active");
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new LoginResponse(token);
    }
}
