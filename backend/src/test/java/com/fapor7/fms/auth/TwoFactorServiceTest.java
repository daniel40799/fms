package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.notifications.EmailCodeSender;
import com.fapor7.fms.notifications.SmsSender;
import com.fapor7.fms.users.UserEntity;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TwoFactorServiceTest {

    private final TwoFactorVerificationRepository repository = mock(TwoFactorVerificationRepository.class);
    private final EmailCodeSender emailCodeSender = mock(EmailCodeSender.class);
    private final SmsSender smsSender = mock(SmsSender.class);
    private final PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @Test
    void startEmailChallengeCreatesRecordWithHashedCodeAndSendsEmail() {
        UserEntity user = TestData.activeUser(1);
        TwoFactorService service = service(true, false);
        when(repository.countByUserIdAndCreatedAtAfter(eq(user.getId()), any(LocalDateTime.class))).thenReturn(0L);
        when(repository.findByUserIdAndStatus(user.getId(), TwoFactorStatus.PENDING)).thenReturn(List.of());

        LoginResponse response = service.startEmailChallenge(user);

        ArgumentCaptor<TwoFactorVerificationEntity> challengeCaptor = ArgumentCaptor.forClass(TwoFactorVerificationEntity.class);
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(repository).save(challengeCaptor.capture());
        verify(emailCodeSender).sendVerificationCode(eq(user.getEmail()), codeCaptor.capture());

        TwoFactorVerificationEntity challenge = challengeCaptor.getValue();
        String code = codeCaptor.getValue();
        assertThat(response.token()).isNull();
        assertThat(response.twoFactorRequired()).isTrue();
        assertThat(response.challengeId()).isEqualTo(challenge.getId());
        assertThat(response.channel()).isEqualTo("EMAIL");
        assertThat(response.maskedDestination()).isEqualTo("u***@example.test");
        assertThat(challenge.getUser()).isSameAs(user);
        assertThat(challenge.getChannel()).isEqualTo(TwoFactorChannel.EMAIL);
        assertThat(challenge.getDestination()).isEqualTo(user.getEmail());
        assertThat(challenge.getStatus()).isEqualTo(TwoFactorStatus.PENDING);
        assertThat(challenge.getExpiresAt()).isAfter(challenge.getCreatedAt());
        assertThat(challenge.getLastSentAt()).isEqualTo(challenge.getCreatedAt());
        assertThat(challenge.getUpdatedAt()).isEqualTo(challenge.getCreatedAt());
        assertThat(challenge.getCodeHash()).isNotEqualTo(code);
        assertThat(passwordEncoder.matches(code, challenge.getCodeHash())).isTrue();
    }

    @Test
    void startSmsChallengeCreatesSmsRecordAndSendsSms() {
        UserEntity user = TestData.activeUser(2);
        user.setMobileNumber("+639171234567");
        TwoFactorService service = service(false, true);
        when(repository.countByUserIdAndCreatedAtAfter(eq(user.getId()), any(LocalDateTime.class))).thenReturn(0L);
        when(repository.findByUserIdAndStatus(user.getId(), TwoFactorStatus.PENDING)).thenReturn(List.of());

        LoginResponse response = service.startSmsChallenge(user);

        ArgumentCaptor<TwoFactorVerificationEntity> challengeCaptor = ArgumentCaptor.forClass(TwoFactorVerificationEntity.class);
        ArgumentCaptor<String> smsCaptor = ArgumentCaptor.forClass(String.class);
        verify(repository).save(challengeCaptor.capture());
        verify(smsSender).send(eq("+639171234567"), smsCaptor.capture());
        verify(emailCodeSender, never()).sendVerificationCode(any(), any());

        TwoFactorVerificationEntity challenge = challengeCaptor.getValue();
        assertThat(response.channel()).isEqualTo("SMS");
        assertThat(response.maskedDestination()).isEqualTo("*******4567");
        assertThat(challenge.getChannel()).isEqualTo(TwoFactorChannel.SMS);
        assertThat(challenge.getDestination()).isEqualTo("+639171234567");
        assertThat(passwordEncoder.matches(extractSmsCode(smsCaptor.getValue()), challenge.getCodeHash())).isTrue();
    }

    @Test
    void startSmsChallengeRejectsMissingMobileNumber() {
        UserEntity user = TestData.activeUser(3);

        assertThatThrownBy(() -> service(false, true).startSmsChallenge(user))
                .isInstanceOf(AuthException.class)
                .hasMessage("SMS verification is not available for this account.");
    }

    @Test
    void verifyCorrectOtpReturnsUserAndConsumesChallenge() {
        UserEntity user = TestData.activeUser(4);
        TwoFactorVerificationEntity challenge = challenge(user, TwoFactorChannel.EMAIL, "123456");
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        UserEntity response = service(true, false).verify(challenge.getId(), " 123456 ");

        assertThat(response).isSameAs(user);
        assertThat(challenge.getStatus()).isEqualTo(TwoFactorStatus.VERIFIED);
        assertThat(challenge.getVerifiedAt()).isNotNull();
        assertThat(challenge.getConsumedAt()).isNotNull();
        verify(repository).save(challenge);
    }

    @Test
    void verifyWrongOtpIncrementsFailedAttemptCount() {
        TwoFactorVerificationEntity challenge = challenge(TestData.activeUser(5), TwoFactorChannel.EMAIL, "123456");
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service(true, false).verify(challenge.getId(), "000000"))
                .isInstanceOf(AuthException.class)
                .hasMessage("Invalid or expired verification code.");

        assertThat(challenge.getFailedAttemptCount()).isEqualTo(1);
        assertThat(challenge.getStatus()).isEqualTo(TwoFactorStatus.PENDING);
        verify(repository).save(challenge);
    }

    @Test
    void expiredOtpIsRejectedAndMarkedExpired() {
        TwoFactorVerificationEntity challenge = challenge(TestData.activeUser(6), TwoFactorChannel.EMAIL, "123456");
        challenge.setExpiresAt(LocalDateTime.now().minusMinutes(1));
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service(true, false).verify(challenge.getId(), "123456"))
                .isInstanceOf(AuthException.class)
                .hasMessage("Invalid or expired verification code.");

        assertThat(challenge.getStatus()).isEqualTo(TwoFactorStatus.EXPIRED);
        verify(repository).save(challenge);
    }

    @Test
    void consumedOtpCannotBeReused() {
        TwoFactorVerificationEntity challenge = challenge(TestData.activeUser(7), TwoFactorChannel.EMAIL, "123456");
        challenge.setStatus(TwoFactorStatus.VERIFIED);
        challenge.setVerifiedAt(LocalDateTime.now().minusMinutes(1));
        challenge.setConsumedAt(LocalDateTime.now().minusMinutes(1));
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service(true, false).verify(challenge.getId(), "123456"))
                .isInstanceOf(AuthException.class)
                .hasMessage("Invalid or expired verification code.");

        verify(repository, never()).save(challenge);
    }

    @Test
    void maxFailedAttemptsIsEnforcedAndExpiresChallenge() {
        TwoFactorVerificationEntity challenge = challenge(TestData.activeUser(8), TwoFactorChannel.EMAIL, "123456");
        challenge.setFailedAttemptCount(5);
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service(true, false).verify(challenge.getId(), "123456"))
                .isInstanceOf(AuthException.class)
                .hasMessage("Too many verification attempts. Please request a new code.");

        assertThat(challenge.getStatus()).isEqualTo(TwoFactorStatus.EXPIRED);
        verify(repository).save(challenge);
    }

    @Test
    void resendCooldownIsEnforced() {
        TwoFactorVerificationEntity challenge = challenge(TestData.activeUser(9), TwoFactorChannel.EMAIL, "123456");
        challenge.setLastSentAt(LocalDateTime.now().minusSeconds(10));
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        assertThatThrownBy(() -> service(true, false).resend(challenge.getId()))
                .isInstanceOf(AuthException.class)
                .hasMessage("Please wait before requesting another verification code.");
    }

    @Test
    void resendCreatesNewCodeHashAndIncrementsResendCount() {
        TwoFactorVerificationEntity challenge = challenge(TestData.activeUser(10), TwoFactorChannel.EMAIL, "123456");
        challenge.setLastSentAt(LocalDateTime.now().minusMinutes(2));
        String originalHash = challenge.getCodeHash();
        when(repository.findById(challenge.getId())).thenReturn(Optional.of(challenge));

        LoginResponse response = service(true, false).resend(challenge.getId());

        assertThat(response.twoFactorRequired()).isTrue();
        assertThat(challenge.getResendCount()).isEqualTo(1);
        assertThat(challenge.getCodeHash()).isNotEqualTo(originalHash);
        verify(repository).save(challenge);
        verify(emailCodeSender).sendVerificationCode(eq(challenge.getDestination()), any());
    }

    @Test
    void maxChallengesPerHourIsEnforced() {
        UserEntity user = TestData.activeUser(11);
        TwoFactorService service = service(true, false);
        when(repository.countByUserIdAndCreatedAtAfter(eq(user.getId()), any(LocalDateTime.class))).thenReturn(5L);

        assertThatThrownBy(() -> service.startEmailChallenge(user))
                .isInstanceOf(AuthException.class)
                .hasMessage("Too many verification attempts. Please request a new code.");
    }

    @Test
    void emailDeliveryFailureUsesStructuredAuthException() {
        UserEntity user = TestData.activeUser(12);
        TwoFactorService service = service(true, false);
        when(repository.countByUserIdAndCreatedAtAfter(eq(user.getId()), any(LocalDateTime.class))).thenReturn(0L);
        when(repository.findByUserIdAndStatus(user.getId(), TwoFactorStatus.PENDING)).thenReturn(List.of());
        doThrow(new RuntimeException("provider down")).when(emailCodeSender).sendVerificationCode(eq(user.getEmail()), any());

        assertThatThrownBy(() -> service.startEmailChallenge(user))
                .isInstanceOf(AuthException.class)
                .hasMessage("Unable to send verification code.")
                .extracting("code")
                .isEqualTo("VERIFICATION_DELIVERY_FAILED");
    }

    @Test
    void smsDeliveryFailureUsesStructuredAuthException() {
        UserEntity user = TestData.activeUser(13);
        user.setMobileNumber("+639171234567");
        TwoFactorService service = service(false, true);
        when(repository.countByUserIdAndCreatedAtAfter(eq(user.getId()), any(LocalDateTime.class))).thenReturn(0L);
        when(repository.findByUserIdAndStatus(user.getId(), TwoFactorStatus.PENDING)).thenReturn(List.of());
        doThrow(new RuntimeException("provider down")).when(smsSender).send(eq("+639171234567"), any());

        assertThatThrownBy(() -> service.startSmsChallenge(user))
                .isInstanceOf(AuthException.class)
                .hasMessage("Unable to send verification code.")
                .extracting("code")
                .isEqualTo("VERIFICATION_DELIVERY_FAILED");
    }

    private TwoFactorService service(boolean emailEnabled, boolean smsEnabled) {
        return new TwoFactorService(
                repository,
                emailCodeSender,
                smsSender,
                passwordEncoder,
                emailEnabled,
                smsEnabled,
                6,
                10,
                60,
                5,
                5
        );
    }

    private TwoFactorVerificationEntity challenge(UserEntity user, TwoFactorChannel channel, String code) {
        LocalDateTime now = LocalDateTime.now().minusMinutes(2);
        TwoFactorVerificationEntity challenge = new TwoFactorVerificationEntity();
        challenge.setId(java.util.UUID.randomUUID());
        challenge.setUser(user);
        challenge.setChannel(channel);
        challenge.setDestination(channel == TwoFactorChannel.EMAIL ? user.getEmail() : "+639171234567");
        challenge.setCodeHash(passwordEncoder.encode(code));
        challenge.setStatus(TwoFactorStatus.PENDING);
        challenge.setExpiresAt(LocalDateTime.now().plusMinutes(10));
        challenge.setLastSentAt(now);
        challenge.setCreatedAt(now);
        challenge.setUpdatedAt(now);
        return challenge;
    }

    private String extractSmsCode(String message) {
        return message.replaceFirst(".*code is (\\d+).*", "$1");
    }
}
