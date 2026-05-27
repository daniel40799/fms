package com.fapor7.fms.auth;

import com.fapor7.fms.users.UserEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Stored one-time verification challenge for login 2FA.
 */
@Getter
@Setter
@Entity
@Table(name = "two_factor_verifications")
public class TwoFactorVerificationEntity {

    @Id
    private UUID id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    private TwoFactorChannel channel;

    private String destination;

    @Column(name = "code_hash")
    private String codeHash;

    @Enumerated(EnumType.STRING)
    private TwoFactorStatus status;

    @Column(name = "failed_attempt_count")
    private int failedAttemptCount;

    @Column(name = "resend_count")
    private int resendCount;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;

    @Column(name = "last_sent_at")
    private LocalDateTime lastSentAt;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
