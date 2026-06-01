package com.fapor7.fms.notifications;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chooses the SMS sender implementation for the current environment.
 */
@Configuration
@EnableConfigurationProperties(SemaphoreSmsProperties.class)
public class SmsConfiguration {

    @Bean
    public SmsSender smsSender(SemaphoreSmsProperties properties) {
        if (!properties.isEnabled()) {
            return new NoOpSmsSender();
        }

        if (!properties.hasRequiredSettings()) {
            throw new IllegalStateException("Semaphore SMS is enabled but required settings are missing");
        }

        // TODO: Verify Semaphore credentials, sender name approval, and production quota before enabling in production.
        return new SemaphoreSmsSender(properties);
    }
}
