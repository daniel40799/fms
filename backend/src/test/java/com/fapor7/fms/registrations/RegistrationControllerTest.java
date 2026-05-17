package com.fapor7.fms.registrations;

import com.fapor7.fms.TestData;
import com.fapor7.fms.registrations.dto.RegistrationApprovalRequest;
import com.fapor7.fms.registrations.dto.RegistrationCreateRequest;
import com.fapor7.fms.registrations.dto.RegistrationResponse;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RegistrationControllerTest {

    private final RegistrationService registrationService = mock(RegistrationService.class);
    private final RegistrationController controller = new RegistrationController(registrationService);

    @Test
    void registerDelegatesToService() {
        RegistrationCreateRequest request = new RegistrationCreateRequest(TestData.uuid(1));
        RegistrationResponse response = response();
        var principal = TestData.principal(TestData.activeUser(1));
        when(registrationService.register(request, principal)).thenReturn(response);

        assertThat(controller.register(request, principal)).isSameAs(response);
    }

    @Test
    void myRegistrationsDelegatesToService() {
        var principal = TestData.principal(TestData.activeUser(1));
        RegistrationResponse response = response();
        when(registrationService.findMyRegistrations(principal)).thenReturn(List.of(response));

        assertThat(controller.myRegistrations(principal)).containsExactly(response);
    }

    @Test
    void findAllDelegatesToService() {
        RegistrationResponse response = response();
        when(registrationService.findAll()).thenReturn(List.of(response));

        assertThat(controller.findAll()).containsExactly(response);
    }

    @Test
    void uploadPaymentProofDelegatesToService() {
        var principal = TestData.principal(TestData.activeUser(1));
        MockMultipartFile file = new MockMultipartFile("file", "proof.txt", "text/plain", "paid".getBytes());
        RegistrationResponse response = response();
        when(registrationService.uploadPaymentProof(TestData.uuid(1), "REF", file, principal)).thenReturn(response);

        assertThat(controller.uploadPaymentProof(TestData.uuid(1), "REF", file, principal)).isSameAs(response);
    }

    @Test
    void approveDelegatesToService() {
        var principal = TestData.principal(TestData.activeUser(1));
        RegistrationApprovalRequest request = new RegistrationApprovalRequest("ok");
        RegistrationResponse response = response();
        when(registrationService.approve(TestData.uuid(1), request, principal)).thenReturn(response);

        assertThat(controller.approve(TestData.uuid(1), request, principal)).isSameAs(response);
    }

    @Test
    void downloadPaymentProofDelegatesToService() {
        ResponseEntity<org.springframework.core.io.Resource> response = ResponseEntity.ok(new ByteArrayResource("paid".getBytes()));
        when(registrationService.downloadPaymentProof(TestData.uuid(1))).thenReturn(response);

        assertThat(controller.downloadPaymentProof(TestData.uuid(1))).isSameAs(response);
    }

    private static RegistrationResponse response() {
        return new RegistrationResponse(
                TestData.uuid(1),
                TestData.uuid(2),
                "Event",
                TestData.uuid(3),
                "User",
                "PENDING_PAYMENT",
                TestData.time(1),
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null
        );
    }
}
