package com.fapor7.fms.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Development email sender that logs verification codes.
 */
@Service
public class LoggingEmailCodeSender implements EmailCodeSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingEmailCodeSender.class);

    @Override
    public void sendVerificationCode(String email, String code) {
        LOGGER.info("Email 2FA code for {} is {}", email, code);
    }
}
