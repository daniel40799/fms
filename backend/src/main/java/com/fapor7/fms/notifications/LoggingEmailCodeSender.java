package com.fapor7.fms.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Development email sender that logs verification codes.
 */
public class LoggingEmailCodeSender implements EmailCodeSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(LoggingEmailCodeSender.class);
    private final boolean logCodes;

    public LoggingEmailCodeSender(boolean logCodes) {
        this.logCodes = logCodes;
    }

    @Override
    public void sendVerificationCode(String email, String code) {
        if (logCodes) {
            LOGGER.info("Email 2FA code for {} is {}", email, code);
            return;
        }

        LOGGER.info("Email 2FA delivery is not configured for {}", email);
    }
}
