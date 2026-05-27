package com.fapor7.fms.notifications;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Local-development SMS sender used when SMS is disabled.
 */
public class NoOpSmsSender implements SmsSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(NoOpSmsSender.class);

    @Override
    public void send(String mobileNumber, String message) {
        LOGGER.info("SMS sending disabled. Would send to {}: {}", mobileNumber, message);
    }
}
