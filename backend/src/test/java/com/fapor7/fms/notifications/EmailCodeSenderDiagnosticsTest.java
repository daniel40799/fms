package com.fapor7.fms.notifications;

import com.azure.communication.email.EmailClient;
import com.azure.communication.email.models.EmailMessage;
import com.azure.core.exception.HttpResponseException;
import com.azure.core.http.HttpResponse;
import com.fapor7.fms.auth.AuthException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(OutputCaptureExtension.class)
class EmailCodeSenderDiagnosticsTest {

    @Test
    void startupDiagnosticsLogConnectionStringPresenceWithoutSecret(CapturedOutput output) {
        AzureCommunicationEmailProperties properties = new AzureCommunicationEmailProperties();
        properties.setEnabled(false);
        properties.setConnectionString("endpoint=https://example.communication.azure.com/;accessKey=secret-key");
        properties.setSenderAddress("DoNotReply@example.test");
        properties.setSubject("Sign in code");
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("dev");

        EmailCodeSender sender = new EmailCodeSenderConfiguration()
                .emailCodeSender(properties, true, true, 10, environment);

        assertThat(sender).isInstanceOf(LoggingEmailCodeSender.class);
        assertThat(output)
                .contains("Email 2FA startup diagnostics")
                .contains("activeProfiles=[dev]")
                .contains("app.two-factor.email.enabled=true")
                .contains("app.two-factor.email.log-codes=true")
                .contains("app.two-factor.email.acs.enabled=false")
                .contains("app.two-factor.email.acs.connection-string.present=true")
                .contains("app.two-factor.email.acs.sender-address=DoNotReply@example.test")
                .contains("app.two-factor.email.acs.subject=Sign in code")
                .doesNotContain("secret-key")
                .doesNotContain("endpoint=https://example.communication.azure.com/");
    }

    @Test
    void acsSenderLogsFailureDiagnosticsWithoutSecretsOrOtp(CapturedOutput output) {
        EmailClient emailClient = mock(EmailClient.class);
        HttpResponse response = mock(HttpResponse.class);
        when(response.getStatusCode()).thenReturn(403);
        HttpResponseException exception = new HttpResponseException(
                "ACS rejected request. endpoint=https://example.communication.azure.com/;accessKey=secret-key "
                        + "Authorization: Bearer token-value",
                response,
                new TestAzureError("InvalidSenderAddress")
        );
        when(emailClient.beginSend(any(EmailMessage.class))).thenThrow(exception);
        AzureCommunicationEmailCodeSender sender = new AzureCommunicationEmailCodeSender(
                emailClient,
                "DoNotReply@example.test",
                "Sign in code",
                10
        );

        assertThatThrownBy(() -> sender.sendVerificationCode("recipient@example.test", "123456"))
                .isInstanceOf(AuthException.class)
                .hasMessage("Unable to send verification code.")
                .extracting("code")
                .isEqualTo("VERIFICATION_DELIVERY_FAILED");

        assertThat(output)
                .contains("ACS Email 2FA send attempt: senderAddress=DoNotReply@example.test, "
                        + "recipient=r***@example.test, subject=Sign in code")
                .contains("ACS Email 2FA send failed")
                .contains("exceptionClass=com.azure.core.exception.HttpResponseException")
                .contains("statusCode=403")
                .contains("errorCode=InvalidSenderAddress")
                .contains("endpoint=[REDACTED]")
                .contains("accessKey=[REDACTED]")
                .contains("Authorization: Bearer [REDACTED]")
                .doesNotContain("https://example.communication.azure.com/")
                .doesNotContain("secret-key")
                .doesNotContain("token-value")
                .doesNotContain("123456")
                .doesNotContain("recipient@example.test");
    }

    private record TestAzureError(String code) {

        public String getCode() {
            return code;
        }
    }
}
