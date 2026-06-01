package com.fapor7.fms.auth;

import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserRepository;
import com.fapor7.fms.users.UserStatus;
import com.fapor7.fms.users.UserService;
import com.fapor7.fms.users.dto.UserCreateRequest;
import com.fapor7.fms.users.dto.UserResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

/**
 * Handles email/password authentication and JWT issuance.
 *
 * <p>The service rejects unknown users, inactive accounts, and invalid
 * passwords before creating a token that identifies the user by UUID.</p>
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TwoFactorService twoFactorService;

    public AuthService(
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TwoFactorService twoFactorService
    ) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.twoFactorService = twoFactorService;
    }

    /**
     * Validates login credentials and creates a bearer token.
     *
     * @param request submitted email and raw password
     * @return response containing a signed JWT
     * @throws AuthException when credentials are invalid or the account is inactive
     */
    public LoginResponse login(LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase(Locale.ROOT);
        UserEntity user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(AuthException::invalidCredentials);

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw AuthException.inactiveAccount();
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw AuthException.invalidCredentials();
        }

        if (request.channel() != null) {
            return startRequestedChallenge(user, request.channel());
        }

        if (twoFactorService.isEmailEnabled()) {
            return twoFactorService.startEmailChallenge(user);
        }

        String token = jwtService.generateToken(user.getId(), user.getEmail());

        return new LoginResponse(token);
    }

    /**
     * Completes a 2FA challenge and issues the normal app token.
     *
     * @param request challenge id and submitted code
     * @return bearer token response
     */
    public LoginResponse verifyTwoFactor(VerifyTwoFactorRequest request) {
        UserEntity user = twoFactorService.verify(request.challengeId(), request.code());
        return new LoginResponse(jwtService.generateToken(user.getId(), user.getEmail()));
    }

    /**
     * Resends an email 2FA code for a pending login challenge.
     *
     * @param request challenge id
     * @return updated challenge response
     */
    public LoginResponse resendTwoFactor(ResendTwoFactorRequest request) {
        return twoFactorService.resend(request.challengeId());
    }

    /**
     * Creates a public self-registered account.
     *
     * <p>The request cannot provide roles or status. User creation applies the
     * default end-user role and active status.</p>
     *
     * @param request public registration payload
     * @return created user profile
     */
    public UserResponse register(RegisterRequest request) {
        return userService.createPendingEndUser(new UserCreateRequest(
                request.email(),
                request.password(),
                request.fullName(),
                null,
                null,
                null,
                null,
                null,
                null,
                request.mobileNumber(),
                null,
                request.organizationIds(),
                request.organizationId(),
                null
        ));
    }

    /**
     * Creates an app JWT for an authenticated OIDC provider user.
     *
     * <p>Existing local accounts are matched by email. A provider identity
     * without a matching local account is provisioned as an end user with an
     * unguessable password placeholder so email/password login remains
     * unavailable until the account is explicitly managed locally.</p>
     *
     * @param oauth2User provider principal containing OIDC profile claims
     * @return response containing an app JWT
     */
    public LoginResponse loginSso(OAuth2User oauth2User) {
        String email = firstAttribute(oauth2User, "email", "preferred_username", "upn");

        if (email == null || email.isBlank()) {
            throw new RuntimeException("SSO provider did not return an email address");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        UserEntity user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> provisionSsoUser(
                        normalizedEmail,
                        firstAttribute(oauth2User, "name", "given_name")
                ));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw AuthException.inactiveAccount();
        }

        return new LoginResponse(jwtService.generateToken(user.getId(), user.getEmail()));
    }

    private LoginResponse startRequestedChallenge(UserEntity user, TwoFactorChannel channel) {
        if (channel == TwoFactorChannel.EMAIL) {
            if (!twoFactorService.isEmailEnabled()) {
                throw AuthException.verificationUnavailable("Email verification is not available.");
            }
            return twoFactorService.startEmailChallenge(user);
        }

        if (channel == TwoFactorChannel.SMS) {
            if (!twoFactorService.isSmsEnabled()) {
                throw AuthException.verificationUnavailable("SMS verification is not available.");
            }
            return twoFactorService.startSmsChallenge(user);
        }

        throw AuthException.verificationUnavailable("Verification channel is not available.");
    }

    private UserEntity provisionSsoUser(String email, String fullName) {
        userService.create(new UserCreateRequest(
                email,
                UUID.randomUUID() + "-" + UUID.randomUUID(),
                fullName == null || fullName.isBlank() ? email : fullName.trim(),
                null,
                null
        ));

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Failed to provision SSO user"));
    }

    private String firstAttribute(OAuth2User oauth2User, String... names) {
        for (String name : names) {
            Object value = oauth2User.getAttributes().get(name);
            if (value instanceof String text && !text.isBlank()) {
                return text;
            }
        }

        return null;
    }
}
