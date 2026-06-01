package com.fapor7.fms.notifications;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Semaphore SMS configuration read from application properties or environment variables.
 */
@ConfigurationProperties(prefix = "app.sms.semaphore")
public class SemaphoreSmsProperties {

    private boolean enabled;
    private String apiKey = "";
    private String senderName = "";
    private String baseUrl = "https://api.semaphore.co/api/v4/messages";

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getSenderName() {
        return senderName;
    }

    public void setSenderName(String senderName) {
        this.senderName = senderName;
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public boolean hasRequiredSettings() {
        return apiKey != null && !apiKey.isBlank()
                && senderName != null && !senderName.isBlank()
                && baseUrl != null && !baseUrl.isBlank();
    }
}
