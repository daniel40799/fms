package com.fapor7.fms.notifications;

/**
 * Sends email verification codes.
 */
public interface EmailCodeSender {

    void sendVerificationCode(String email, String code);
}
