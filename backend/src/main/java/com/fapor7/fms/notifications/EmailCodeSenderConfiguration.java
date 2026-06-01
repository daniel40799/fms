package com.fapor7.fms.notifications;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chooses the email code sender for the current environment.
 */
@Configuration
@EnableConfigurationProperties(AzureCommunicationEmailProperties.class)
public class EmailCodeSenderConfiguration {

    @Bean
    public EmailCodeSender emailCodeSender(
            AzureCommunicationEmailProperties acsProperties,
            @Value("${app.two-factor.email.enabled:false}") boolean emailTwoFactorEnabled,
            @Value("${app.two-factor.email.log-codes:false}") boolean logCodes,
            @Value("${app.two-factor.expiry-minutes:10}") long expiryMinutes
    ) {
        if (acsProperties.isEnabled()) {
            if (!acsProperties.hasRequiredSettings()) {
                throw new IllegalStateException("ACS Email is enabled but required settings are missing");
            }

            return new AzureCommunicationEmailCodeSender(acsProperties, expiryMinutes);
        }

        if (emailTwoFactorEnabled && !logCodes) {
            throw new IllegalStateException("Email 2FA is enabled but no usable email sender is configured");
        }

        return new LoggingEmailCodeSender(logCodes);
    }
}
