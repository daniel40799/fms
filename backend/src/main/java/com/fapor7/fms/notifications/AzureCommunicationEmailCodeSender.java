package com.fapor7.fms.notifications;

import com.azure.communication.email.EmailClient;
import com.azure.communication.email.EmailClientBuilder;
import com.azure.communication.email.models.EmailMessage;
import com.azure.core.exception.HttpResponseException;
import com.fapor7.fms.auth.AuthException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.lang.reflect.Method;
import java.util.regex.Pattern;

/**
 * Sends 2FA email codes with Azure Communication Services Email.
 */
public class AzureCommunicationEmailCodeSender implements EmailCodeSender {

    private static final Logger LOGGER = LoggerFactory.getLogger(AzureCommunicationEmailCodeSender.class);
    private static final Pattern SECRET_ASSIGNMENT_PATTERN = Pattern.compile(
            "(?i)(endpoint|accesskey|accountkey|sharedaccesssignature|sig|secret|password|credential|apikey|api-key)(\\s*[=:]\\s*)[^;,&\\s]+"
    );
    private static final Pattern AUTHORIZATION_PATTERN = Pattern.compile(
            "(?i)(authorization\\s*:\\s*(?:bearer|basic|hmac-sha256)\\s+)[^;,&\\s]+"
    );

    private final EmailClient emailClient;
    private final String senderAddress;
    private final String subject;
    private final long expiryMinutes;

    public AzureCommunicationEmailCodeSender(
            AzureCommunicationEmailProperties properties,
            long expiryMinutes
    ) {
        this(
                new EmailClientBuilder()
                        .connectionString(properties.getConnectionString())
                        .buildClient(),
                properties.getSenderAddress(),
                properties.getSubject(),
                expiryMinutes
        );
    }

    AzureCommunicationEmailCodeSender(
            EmailClient emailClient,
            String senderAddress,
            String subject,
            long expiryMinutes
    ) {
        this.emailClient = emailClient;
        this.senderAddress = senderAddress;
        this.subject = subject;
        this.expiryMinutes = expiryMinutes;
    }

    @Override
    public void sendVerificationCode(String email, String code) {
        String maskedRecipient = maskEmail(email);
        LOGGER.info(
                "ACS Email 2FA send attempt: senderAddress={}, recipient={}, subject={}",
                safeLogValue(senderAddress),
                maskedRecipient,
                safeLogValue(subject)
        );

        EmailMessage message = new EmailMessage()
                .setSenderAddress(senderAddress)
                .setToRecipients(email)
                .setSubject(subject)
                .setBodyPlainText(body(code));

        try {
            emailClient.beginSend(message).waitForCompletion();
        } catch (RuntimeException exception) {
            LOGGER.warn(
                    "ACS Email 2FA send failed: exceptionClass={}, statusCode={}, errorCode={}, message={}",
                    exception.getClass().getName(),
                    valueOrNotAvailable(statusCode(exception)),
                    valueOrNotAvailable(errorCode(exception)),
                    safeExceptionMessage(exception)
            );
            throw AuthException.deliveryFailure();
        }
    }

    private String body(String code) {
        return "Your Fapor7 verification code is: " + code + "\n"
                + "This code will expire in " + expiryMinutes + " minutes.\n"
                + "If you did not request this code, you can ignore this email.";
    }

    private String maskEmail(String email) {
        if (email == null || email.isBlank()) {
            return "(blank)";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }

        if (atIndex == 1) {
            return "***" + email.substring(atIndex);
        }

        return email.charAt(0) + "***" + email.substring(atIndex);
    }

    private String statusCode(RuntimeException exception) {
        if (exception instanceof HttpResponseException httpResponseException
                && httpResponseException.getResponse() != null) {
            return String.valueOf(httpResponseException.getResponse().getStatusCode());
        }

        return null;
    }

    private String errorCode(RuntimeException exception) {
        if (!(exception instanceof HttpResponseException httpResponseException)) {
            return null;
        }

        Object value = httpResponseException.getValue();
        String code = stringValue(invokeGetter(value, "getCode"));
        if (code != null) {
            return code;
        }

        code = stringValue(invokeGetter(value, "getErrorCode"));
        if (code != null) {
            return code;
        }

        Object error = invokeGetter(value, "getError");
        code = stringValue(invokeGetter(error, "getCode"));
        if (code != null) {
            return code;
        }

        return stringValue(invokeGetter(error, "getErrorCode"));
    }

    private Object invokeGetter(Object target, String methodName) {
        if (target == null) {
            return null;
        }

        try {
            Method method = target.getClass().getMethod(methodName);
            method.setAccessible(true);
            return method.invoke(target);
        } catch (ReflectiveOperationException | SecurityException exception) {
            return null;
        }
    }

    private String stringValue(Object value) {
        if (value == null) {
            return null;
        }

        String text = value.toString();
        if (text.isBlank()) {
            return null;
        }

        return text;
    }

    private String valueOrNotAvailable(String value) {
        return value == null ? "n/a" : value;
    }

    private String safeLogValue(String value) {
        if (value == null || value.isBlank()) {
            return "(blank)";
        }

        return value.replaceAll("[\\r\\n\\t]+", " ").trim();
    }

    private String safeExceptionMessage(RuntimeException exception) {
        String message = exception.getMessage();
        if (message == null || message.isBlank()) {
            return "(no message)";
        }

        String sanitized = message.replaceAll("[\\r\\n\\t]+", " ").trim();
        sanitized = SECRET_ASSIGNMENT_PATTERN.matcher(sanitized).replaceAll("$1$2[REDACTED]");
        sanitized = AUTHORIZATION_PATTERN.matcher(sanitized).replaceAll("$1[REDACTED]");
        return sanitized;
    }
}
