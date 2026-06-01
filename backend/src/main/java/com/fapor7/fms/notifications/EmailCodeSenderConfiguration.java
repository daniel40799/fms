package com.fapor7.fms.notifications;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;

/**
 * Chooses the email code sender for the current environment.
 */
@Configuration
@EnableConfigurationProperties(AzureCommunicationEmailProperties.class)
public class EmailCodeSenderConfiguration {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailCodeSenderConfiguration.class);

    @Bean
    public EmailCodeSender emailCodeSender(
            AzureCommunicationEmailProperties acsProperties,
            @Value("${app.two-factor.email.enabled:false}") boolean emailTwoFactorEnabled,
            @Value("${app.two-factor.email.log-codes:false}") boolean logCodes,
            @Value("${app.two-factor.expiry-minutes:10}") long expiryMinutes,
            Environment environment
    ) {
        logStartupDiagnostics(environment, acsProperties, emailTwoFactorEnabled, logCodes);

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

    private void logStartupDiagnostics(
            Environment environment,
            AzureCommunicationEmailProperties acsProperties,
            boolean emailTwoFactorEnabled,
            boolean logCodes
    ) {
        LOGGER.info(
                "Email 2FA startup diagnostics: activeProfiles={}, app.two-factor.email.enabled={}, "
                        + "app.two-factor.email.log-codes={}, app.two-factor.email.acs.enabled={}, "
                        + "app.two-factor.email.acs.connection-string.present={}, "
                        + "app.two-factor.email.acs.sender-address={}, app.two-factor.email.acs.subject={}",
                Arrays.toString(environment.getActiveProfiles()),
                emailTwoFactorEnabled,
                logCodes,
                acsProperties.isEnabled(),
                hasText(acsProperties.getConnectionString()),
                safeLogValue(acsProperties.getSenderAddress()),
                safeLogValue(acsProperties.getSubject())
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String safeLogValue(String value) {
        if (!hasText(value)) {
            return "(blank)";
        }

        return value.replaceAll("[\\r\\n\\t]+", " ").trim();
    }
}
