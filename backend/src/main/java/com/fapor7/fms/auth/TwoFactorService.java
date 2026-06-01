package com.fapor7.fms.auth;

import com.fapor7.fms.notifications.EmailCodeSender;
import com.fapor7.fms.notifications.SmsSender;
import com.fapor7.fms.users.UserEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Creates, resends, and validates one-time login verification codes.
 */
@Service
public class TwoFactorService {

    private final TwoFactorVerificationRepository repository;
    private final EmailCodeSender emailCodeSender;
    private final SmsSender smsSender;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();
    private final boolean emailEnabled;
    private final boolean smsEnabled;
    private final int codeLength;
    private final long expiryMinutes;
    private final Duration expiry;
    private final Duration resendCooldown;
    private final int maxFailedAttempts;
    private final int maxChallengesPerHour;

    public TwoFactorService(
            TwoFactorVerificationRepository repository,
            EmailCodeSender emailCodeSender,
            SmsSender smsSender,
            PasswordEncoder passwordEncoder,
            @Value("${app.two-factor.email.enabled:true}") boolean emailEnabled,
            @Value("${app.sms.semaphore.enabled:false}") boolean smsEnabled,
            @Value("${app.two-factor.code-length:6}") int codeLength,
            @Value("${app.two-factor.expiry-minutes:10}") long expiryMinutes,
            @Value("${app.two-factor.resend-cooldown-seconds:60}") long resendCooldownSeconds,
            @Value("${app.two-factor.max-failed-attempts:5}") int maxFailedAttempts,
            @Value("${app.two-factor.max-challenges-per-hour:5}") int maxChallengesPerHour
    ) {
        this.repository = repository;
        this.emailCodeSender = emailCodeSender;
        this.smsSender = smsSender;
        this.passwordEncoder = passwordEncoder;
        this.emailEnabled = emailEnabled;
        this.smsEnabled = smsEnabled;
        this.codeLength = codeLength;
        this.expiryMinutes = expiryMinutes;
        this.expiry = Duration.ofMinutes(expiryMinutes);
        this.resendCooldown = Duration.ofSeconds(resendCooldownSeconds);
        this.maxFailedAttempts = maxFailedAttempts;
        this.maxChallengesPerHour = maxChallengesPerHour;
    }

    public boolean isEmailEnabled() {
        return emailEnabled;
    }

    public boolean isSmsEnabled() {
        return smsEnabled;
    }

    /**
     * Starts an email verification challenge for a validated login.
     *
     * @param user authenticated user awaiting second factor
     * @return challenge response without a JWT
     */
    @Transactional
    public LoginResponse startEmailChallenge(UserEntity user) {
        if (!emailEnabled) {
            throw AuthException.verificationUnavailable("Email verification is not available.");
        }

        return startChallenge(user, TwoFactorChannel.EMAIL, user.getEmail());
    }

    /**
     * Starts an SMS verification challenge for a validated login.
     *
     * @param user authenticated user awaiting second factor
     * @return challenge response without a JWT
     */
    @Transactional
    public LoginResponse startSmsChallenge(UserEntity user) {
        if (!smsEnabled) {
            throw AuthException.verificationUnavailable("SMS verification is not available.");
        }

        String destination = user.getMobileNumber();
        if (destination == null || destination.isBlank()) {
            throw AuthException.verificationUnavailable("SMS verification is not available for this account.");
        }

        return startChallenge(user, TwoFactorChannel.SMS, destination);
    }

    private LoginResponse startChallenge(UserEntity user, TwoFactorChannel channel, String destination) {
        LocalDateTime now = LocalDateTime.now();
        long recentChallengeCount = repository.countByUserIdAndCreatedAtAfter(
                user.getId(),
                now.minusHours(1)
        );
        if (recentChallengeCount >= maxChallengesPerHour) {
            throw AuthException.tooManyVerificationAttempts();
        }

        expirePreviousPendingChallenges(user.getId(), now);

        String code = generateCode();
        TwoFactorVerificationEntity challenge = new TwoFactorVerificationEntity();
        challenge.setId(UUID.randomUUID());
        challenge.setUser(user);
        challenge.setChannel(channel);
        challenge.setDestination(destination);
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setStatus(TwoFactorStatus.PENDING);
        challenge.setExpiresAt(now.plus(expiry));
        challenge.setLastSentAt(now);
        challenge.setCreatedAt(now);
        challenge.setUpdatedAt(now);

        repository.save(challenge);
        sendCode(challenge, code);

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
            throw AuthException.verificationCooldown();
        }

        if (challenge.getExpiresAt().isBefore(now)) {
            challenge.setStatus(TwoFactorStatus.EXPIRED);
            challenge.setUpdatedAt(now);
            repository.save(challenge);
            throw AuthException.invalidVerificationCode();
        }

        String code = generateCode();
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setResendCount(challenge.getResendCount() + 1);
        challenge.setLastSentAt(now);
        challenge.setUpdatedAt(now);
        repository.save(challenge);
        sendCode(challenge, code);

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
            throw AuthException.invalidVerificationCode();
        }

        if (challenge.getExpiresAt().isBefore(now)) {
            challenge.setStatus(TwoFactorStatus.EXPIRED);
            challenge.setUpdatedAt(now);
            repository.save(challenge);
            throw AuthException.invalidVerificationCode();
        }

        if (challenge.getFailedAttemptCount() >= maxFailedAttempts) {
            challenge.setStatus(TwoFactorStatus.EXPIRED);
            challenge.setUpdatedAt(now);
            repository.save(challenge);
            throw AuthException.tooManyVerificationAttempts();
        }

        String code = submittedCode == null ? "" : submittedCode.trim();
        if (!passwordEncoder.matches(code, challenge.getCodeHash())) {
            challenge.setFailedAttemptCount(challenge.getFailedAttemptCount() + 1);
            challenge.setUpdatedAt(now);
            if (challenge.getFailedAttemptCount() >= maxFailedAttempts) {
                challenge.setStatus(TwoFactorStatus.EXPIRED);
                repository.save(challenge);
                throw AuthException.tooManyVerificationAttempts();
            }
            repository.save(challenge);
            throw AuthException.invalidVerificationCode();
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
            throw AuthException.invalidVerificationCode();
        }

        TwoFactorVerificationEntity challenge = repository.findById(challengeId)
                .orElseThrow(AuthException::invalidVerificationCode);

        if (challenge.getStatus() != TwoFactorStatus.PENDING) {
            throw AuthException.invalidVerificationCode();
        }

        return challenge;
    }

    private LoginResponse toChallengeResponse(TwoFactorVerificationEntity challenge) {
        return new LoginResponse(
                null,
                true,
                challenge.getId(),
                challenge.getChannel().name(),
                maskDestination(challenge.getChannel(), challenge.getDestination()),
                challenge.getExpiresAt()
        );
    }

    private void expirePreviousPendingChallenges(UUID userId, LocalDateTime now) {
        List<TwoFactorVerificationEntity> pendingChallenges = repository.findByUserIdAndStatus(userId, TwoFactorStatus.PENDING);
        for (TwoFactorVerificationEntity pendingChallenge : pendingChallenges) {
            if (pendingChallenge.getExpiresAt().isAfter(now)
                    && pendingChallenge.getLastSentAt().plus(resendCooldown).isAfter(now)) {
                throw AuthException.verificationCooldown();
            }

            pendingChallenge.setStatus(TwoFactorStatus.EXPIRED);
            pendingChallenge.setUpdatedAt(now);
            repository.save(pendingChallenge);
        }
    }

    private void sendCode(TwoFactorVerificationEntity challenge, String code) {
        try {
            if (challenge.getChannel() == TwoFactorChannel.EMAIL) {
                emailCodeSender.sendVerificationCode(challenge.getDestination(), code);
                return;
            }

            smsSender.send(
                    challenge.getDestination(),
                    "Your Fapor7 verification code is " + code + ". It expires in " + expiryMinutes + " minutes."
            );
        } catch (AuthException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw AuthException.deliveryFailure();
        }
    }

    private String generateCode() {
        int digits = Math.max(codeLength, 4);
        int bound = (int) Math.pow(10, digits);
        int minimum = (int) Math.pow(10, digits - 1);
        return String.valueOf(minimum + secureRandom.nextInt(bound - minimum));
    }

    private String maskDestination(TwoFactorChannel channel, String destination) {
        if (channel == TwoFactorChannel.SMS) {
            return maskSmsDestination(destination);
        }

        return maskEmailDestination(destination);
    }

    private String maskEmailDestination(String email) {
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return "***" + email.substring(Math.max(atIndex, 0));
        }

        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    private String maskSmsDestination(String mobileNumber) {
        if (mobileNumber == null || mobileNumber.length() <= 4) {
            return "****";
        }

        return "*******" + mobileNumber.substring(mobileNumber.length() - 4);
    }
}
