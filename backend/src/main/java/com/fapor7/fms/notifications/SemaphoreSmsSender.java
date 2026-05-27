package com.fapor7.fms.notifications;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

/**
 * SMS sender backed by Semaphore.
 */
public class SemaphoreSmsSender implements SmsSender {

    private final SemaphoreSmsProperties properties;
    private final HttpClient httpClient;

    public SemaphoreSmsSender(SemaphoreSmsProperties properties) {
        this.properties = properties;
        this.httpClient = HttpClient.newHttpClient();
    }

    @Override
    public void send(String mobileNumber, String message) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new RuntimeException("Semaphore SMS is enabled but app.sms.semaphore.api-key is missing");
        }

        String body = form("apikey", properties.getApiKey())
                + "&" + form("number", mobileNumber)
                + "&" + form("message", message)
                + (properties.getSenderName() == null || properties.getSenderName().isBlank()
                ? ""
                : "&" + form("sendername", properties.getSenderName()));

        HttpRequest request = HttpRequest.newBuilder(URI.create(properties.getBaseUrl()))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("Semaphore SMS request failed with status " + response.statusCode());
            }
        } catch (IOException exception) {
            throw new RuntimeException("Failed to send Semaphore SMS", exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while sending Semaphore SMS", exception);
        }
    }

    private String form(String key, String value) {
        return URLEncoder.encode(key, StandardCharsets.UTF_8)
                + "="
                + URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
