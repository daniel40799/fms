package com.fapor7.fms.notifications;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Azure Communication Services Email settings for 2FA delivery.
 */
@ConfigurationProperties(prefix = "app.two-factor.email.acs")
public class AzureCommunicationEmailProperties {

    private boolean enabled;
    private String connectionString = "";
    private String senderAddress = "";
    private String subject = "Fapor7 verification code";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getConnectionString() {
        return connectionString;
    }

    public void setConnectionString(String connectionString) {
        this.connectionString = connectionString;
    }

    public String getSenderAddress() {
        return senderAddress;
    }

    public void setSenderAddress(String senderAddress) {
        this.senderAddress = senderAddress;
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public boolean hasRequiredSettings() {
        return connectionString != null && !connectionString.isBlank()
                && senderAddress != null && !senderAddress.isBlank();
    }
}
