package com.fapor7.fms.auth;

import com.fapor7.fms.notifications.EmailCodeSender;
import com.fapor7.fms.users.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Creates, resends, and validates one-time login verification codes.
 */
@Service
public class TwoFactorService {

    private final TwoFactorVerificationRepository repository;
    private final EmailCodeSender emailCodeSender;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final boolean emailEnabled;
    private final int codeLength;
    private final Duration expiry;
    private final Duration resendCooldown;
    private final int maxFailedAttempts;
    private final int maxChallengesPerHour;

    public TwoFactorService(
            TwoFactorVerificationRepository repository,
            EmailCodeSender emailCodeSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.two-factor.email.enabled:true}") boolean emailEnabled,
            @Value("${app.two-factor.code-length:6}") int codeLength,
            @Value("${app.two-factor.expiry-minutes:10}") long expiryMinutes,
            @Value("${app.two-factor.resend-cooldown-seconds:60}") long resendCooldownSeconds,
            @Value("${app.two-factor.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${app.two-factor.max-challenges-per-hour:5}") int maxChallengesPerHour
    ) {
        this.repository = repository;
        this.emailCodeSender = emailCodeSender;
        this.passwordEncoder = passwordEncoder;
        this.emailEnabled = emailEnabled;
        this.codeLength = codeLength;
        this.expiry = Duration.ofMinutes(expiryMinutes);
        this.resendCooldown = Duration.ofSeconds(resendCooldownSeconds);
        this.maxFailedAttempts = maxFailedAttempts;
        this.maxChallengesPerHour = maxChallengesPerHour;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    /**
     * Starts an email verification challenge for a validated login.
     *
     * @param user authenticated user awaiting second factor
     * @return challenge response without a JWT
     */
    @Transactional
    public LoginResponse startEmailChallenge(UserEntity user) {
        LocalDateTime now = LocalDateTime.now();
        long recentChallengeCount = repository.countByUserIdAndCreatedAtAfter(
                user.getId(),
                now.minusHours(1)
        );
        if (recentChallengeCount >= maxChallengesPerHour) {
            throw new RuntimeException("Too many verification requests. Try again later.");
        }

        repository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(user.getId(), TwoFactorStatus.PENDING)
                .filter(challenge -> challenge.getExpiresAt().isAfter(now))
                .ifPresent(challenge -> {
                    if (challenge.getLastSentAt().plus(resendCooldown).isAfter(now)) {
                        throw new RuntimeException("Verification code was sent recently. Please wait before requesting another code.");
                    }
                });

        String code = generateCode();
        TwoFactorVerificationEntity challenge = new TwoFactorVerificationEntity();
        challenge.setId(UUID.randomUUID());
        challenge.setUser(user);
        challenge.setChannel(TwoFactorChannel.EMAIL);
        challenge.setDestination(user.getEmail());
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setStatus(TwoFactorStatus.PENDING);
        challenge.setExpiresAt(now.plus(expiry));
        challenge.setLastSentAt(now);
        challenge.setCreatedAt(now);
        challenge.setUpdatedAt(now);

        repository.save(challenge);
        emailCodeSender.sendVerificationCode(user.getEmail(), code);

        return toChallengeResponse(challenge);
    }

    /**
     * Resends a fresh code for an existing pending challenge.
     *
     * @param challengeId challenge id
     * @return updated challenge response
     */
    @Transactional
    public LoginResponse resend(UUID challengeId) {
        TwoFactorVerificationEntity challenge = requirePendingChallenge(challengeId);
        LocalDateTime now = LocalDateTime.now();

        if (challenge.getLastSentAt().plus(resendCooldown).isAfter(now)) {
            throw new RuntimeException("Verification code was sent recently. Please wait before requesting another code.");
        }

        if (challenge.getExpiresAt().isBefore(now)) {
            challenge.setStatus(TwoFactorStatus.EXPIRED);
            challenge.setUpdatedAt(now);
            repository.save(challenge);
            throw new RuntimeException("Verification code expired. Sign in again.");
        }

        String code = generateCode();
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setResendCount(challenge.getResendCount() + 1);
        challenge.setLastSentAt(now);
        challenge.setUpdatedAt(now);
        repository.save(challenge);
        emailCodeSender.sendVerificationCode(challenge.getDestination(), code);

        return toChallengeResponse(challenge);
    }

    /**
     * Verifies and consumes a pending challenge.
     *
     * @param challengeId challenge id
     * @param submittedCode code submitted by the user
     * @return user who owns the verified challenge
     */
    @Transactional
    public UserEntity verify(UUID challengeId, String submittedCode) {
        TwoFactorVerificationEntity challenge = requirePendingChallenge(challengeId);
        LocalDateTime now = LocalDateTime.now();

        if (challenge.getConsumedAt() != null) {
            throw new RuntimeException("Verification code was already used");
        }

        if (challenge.getExpiresAt().isBefore(now)) {
            challenge.setStatus(TwoFactorStatus.EXPIRED);
            challenge.setUpdatedAt(now);
            repository.save(challenge);
            throw new RuntimeException("Verification code expired. Sign in again.");
        }

        if (challenge.getFailedAttemptCount() >= maxFailedAttempts) {
            throw new RuntimeException("Too many invalid verification attempts. Sign in again.");
        }

        String code = submittedCode == null ? "" : submittedCode.trim();
        if (!passwordEncoder.matches(code, challenge.getCodeHash())) {
            challenge.setFailedAttemptCount(challenge.getFailedAttemptCount() + 1);
            challenge.setUpdatedAt(now);
            repository.save(challenge);
            throw new RuntimeException("Invalid verification code");
        }

        challenge.setStatus(TwoFactorStatus.VERIFIED);
        challenge.setVerifiedAt(now);
        challenge.setConsumedAt(now);
        challenge.setUpdatedAt(now);
        repository.save(challenge);

        return challenge.getUser();
    }

    private TwoFactorVerificationEntity requirePendingChallenge(UUID challengeId) {
        if (challengeId == null) {
            throw new RuntimeException("Verification challenge is required");
        }

        TwoFactorVerificationEntity challenge = repository.findById(challengeId)
                .orElseThrow(() -> new RuntimeException("Verification challenge not found"));

        if (challenge.getStatus() != TwoFactorStatus.PENDING) {
            throw new RuntimeException("Verification challenge is no longer active");
        }

        return challenge;
    }

    private LoginResponse toChallengeResponse(TwoFactorVerificationEntity challenge) {
        return new LoginResponse(
                null,
                true,
                challenge.getId(),
                challenge.getChannel().name(),
                maskDestination(challenge.getDestination()),
                challenge.getExpiresAt()
        );
    }

    private String generateCode() {
        int digits = Math.max(codeLength, 4);
        int bound = (int) Math.pow(10, digits);
        int minimum = (int) Math.pow(10, digits - 1);
        return String.valueOf(minimum + secureRandom.nextInt(bound - minimum));
    }

    private String maskDestination(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***" + email.substring(Math.max(atIndex, 0));
        }

        return email.charAt(0) + "***" + email.substring(atIndex);
    }
}
