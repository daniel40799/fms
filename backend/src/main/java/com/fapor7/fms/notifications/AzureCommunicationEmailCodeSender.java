package com.fapor7.fms.notifications;

import com.azure.communication.email.EmailClient;
import com.azure.communication.email.EmailClientBuilder;
import com.azure.communication.email.models.EmailMessage;
import com.fapor7.fms.auth.AuthException;

/**
 * Sends 2FA email codes with Azure Communication Services Email.
 */
public class AzureCommunicationEmailCodeSender implements EmailCodeSender {

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
        EmailMessage message = new EmailMessage()
                .setSenderAddress(senderAddress)
                .setToRecipients(email)
                .setSubject(subject)
                .setBodyPlainText(body(code));

        try {
            emailClient.beginSend(message).waitForCompletion();
        } catch (RuntimeException exception) {
            throw AuthException.deliveryFailure();
        }
    }

    private String body(String code) {
        return "Your Fapor7 verification code is: " + code + "\n"
                + "This code will expire in " + expiryMinutes + " minutes.\n"
                + "If you did not request this code, you can ignore this email.";
    }
}
