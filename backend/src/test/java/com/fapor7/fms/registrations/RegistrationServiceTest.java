package com.fapor7.fms.registrations;

import com.fapor7.fms.TestData;
import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.events.EventRepository;
import com.fapor7.fms.events.EventStatus;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.registrations.dto.RegistrationApprovalRequest;
import com.fapor7.fms.registrations.dto.RegistrationCreateRequest;
import com.fapor7.fms.registrations.dto.RegistrationResponse;
import com.fapor7.fms.storage.StorageContainer;
import com.fapor7.fms.storage.StorageService;
import com.fapor7.fms.storage.StoredFile;
import com.fapor7.fms.storage.StoredResource;
import com.fapor7.fms.users.UserEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RegistrationServiceTest {

    @Mock
    private RegistrationRepository registrationRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private StorageService storageService;

    @Spy
    private PaymentProofProperties paymentProofProperties = new PaymentProofProperties();

    @InjectMocks
    private RegistrationService registrationService;

    @Test
    void registerCreatesPendingPaymentRegistration() {
        UserEntity user = TestData.activeUser(1);
        EventEntity event = TestData.event(2, null, null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(registrationRepository.findByEventIdAndUserId(event.getId(), user.getId())).thenReturn(Optional.empty());
        when(registrationRepository.save(any(RegistrationEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        RegistrationResponse response = registrationService.register(new RegistrationCreateRequest(event.getId()), TestData.principal(user));

        assertThat(response.eventId()).isEqualTo(event.getId());
        assertThat(response.userId()).isEqualTo(user.getId());
        assertThat(response.status()).isEqualTo("PENDING_PAYMENT");
    }

    @Test
    void registerRejectsMissingEvent() {
        when(eventRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.register(new RegistrationCreateRequest(TestData.uuid(99)), TestData.principal(TestData.activeUser(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Event not found");
    }

    @Test
    void registerRejectsDuplicateRegistration() {
        UserEntity user = TestData.activeUser(1);
        EventEntity event = TestData.event(2, null, null);
        RegistrationEntity existing = TestData.registration(3, event, user, RegistrationStatus.PENDING_PAYMENT);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(registrationRepository.findByEventIdAndUserId(event.getId(), user.getId())).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> registrationService.register(new RegistrationCreateRequest(event.getId()), TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("User is already registered to this event");
    }

    @Test
    void registerRejectsInternalFapor7Users() {
        UserEntity user = TestData.activeUser(1);
        OrganizationEntity fapor7 = TestData.organization(7);
        fapor7.setCode("FAPOR7");
        user.setOrganization(fapor7);

        assertThatThrownBy(() -> registrationService.register(new RegistrationCreateRequest(TestData.uuid(2)), TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("FAPOR7 organization users cannot register for events");
    }

    @Test
    void registerRejectsNonPublishedEvent() {
        UserEntity user = TestData.activeUser(1);
        EventEntity event = TestData.event(2, null, null);
        event.setStatus(EventStatus.DRAFT);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> registrationService.register(new RegistrationCreateRequest(event.getId()), TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Only published events accept registrations");
    }

    @Test
    void findMyRegistrationsReturnsOnlyCurrentUsersRegistrations() {
        UserEntity currentUser = TestData.activeUser(1);
        RegistrationEntity mine = TestData.registration(2, TestData.event(3, null, null), currentUser, RegistrationStatus.CONFIRMED);
        RegistrationEntity other = TestData.registration(4, TestData.event(5, null, null), TestData.activeUser(6), RegistrationStatus.CONFIRMED);
        when(registrationRepository.findAll()).thenReturn(List.of(mine, other));

        List<RegistrationResponse> responses = registrationService.findMyRegistrations(TestData.principal(currentUser));

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().id()).isEqualTo(mine.getId());
    }

    @Test
    void findMyRegistrationsHidesInternalFapor7Registrations() {
        UserEntity user = TestData.activeUser(1);
        OrganizationEntity fapor7 = TestData.organization(7);
        fapor7.setCode("fapor7");
        user.setOrganization(fapor7);

        assertThat(registrationService.findMyRegistrations(TestData.principal(user))).isEmpty();
    }

    @Test
    void findAllMapsRegistrations() {
        RegistrationEntity registration = TestData.registration(1, TestData.event(2, null, null), TestData.activeUser(3), RegistrationStatus.PAYMENT_UPLOADED);
        when(registrationRepository.findAll()).thenReturn(List.of(registration));

        List<RegistrationResponse> responses = registrationService.findAll();

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().status()).isEqualTo("PAYMENT_UPLOADED");
    }

    @Test
    void uploadPaymentProofStoresFileAndMarksRegistrationForReview() throws IOException {
        UserEntity user = TestData.activeUser(1);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), user, RegistrationStatus.PENDING_PAYMENT);
        MockMultipartFile file = new MockMultipartFile("file", "proof.pdf", "application/pdf", "paid".getBytes());
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
        when(storageService.store(eq(StorageContainer.PAYMENT_PROOFS), eq(file), anyString()))
                .thenReturn(new StoredFile("payment-proofs/proof.pdf", "proof.pdf", "application/pdf", 4));
        when(registrationRepository.save(registration)).thenReturn(registration);

        RegistrationResponse response = registrationService.uploadPaymentProof(registration.getId(), "REF-1", file, TestData.principal(user));

        assertThat(response.paymentReference()).isEqualTo("REF-1");
        assertThat(response.paymentFilePath()).isEqualTo("payment-proofs/proof.pdf");
        assertThat(response.status()).isEqualTo("PAYMENT_UPLOADED");
    }

    @Test
    void uploadPaymentProofRejectsMissingRegistration() {
        when(registrationRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(TestData.uuid(99), "REF", new MockMultipartFile("file", new byte[0]), TestData.principal(TestData.activeUser(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Registration not found");
    }

    @Test
    void uploadPaymentProofRejectsOtherUsersRegistration() {
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), TestData.activeUser(1), RegistrationStatus.PENDING_PAYMENT);
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(registration.getId(), "REF", new MockMultipartFile("file", new byte[0]), TestData.principal(TestData.activeUser(9))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("You can only upload payment proof for your own registration");
    }

    @Test
    void uploadPaymentProofRejectsOversizedFiles() {
        UserEntity user = TestData.activeUser(1);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), user, RegistrationStatus.PENDING_PAYMENT);
        paymentProofProperties.setMaxSizeBytes(3);
        MockMultipartFile file = new MockMultipartFile("file", "proof.pdf", "application/pdf", "paid".getBytes());
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(registration.getId(), "REF", file, TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment proof exceeds the maximum allowed size");
    }

    @Test
    void uploadPaymentProofRejectsUnsupportedContentTypes() {
        UserEntity user = TestData.activeUser(1);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), user, RegistrationStatus.PENDING_PAYMENT);
        MockMultipartFile file = new MockMultipartFile("file", "proof.pdf", "text/plain", "paid".getBytes());
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(registration.getId(), "REF", file, TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment proof must be a JPG, PNG, or PDF file");
    }

    @Test
    void uploadPaymentProofRejectsUnsupportedExtensions() {
        UserEntity user = TestData.activeUser(1);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), user, RegistrationStatus.PENDING_PAYMENT);
        MockMultipartFile file = new MockMultipartFile("file", "proof.gif", "image/png", "image".getBytes());
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(registration.getId(), "REF", file, TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment proof must use a JPG, PNG, or PDF file extension");
    }

    @Test
    void uploadPaymentProofRejectsMismatchedExtensionsAndContentTypes() {
        UserEntity user = TestData.activeUser(1);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), user, RegistrationStatus.PENDING_PAYMENT);
        MockMultipartFile file = new MockMultipartFile("file", "proof.jpg", "application/pdf", "paid".getBytes());
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(registration.getId(), "REF", file, TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Payment proof file extension does not match its content type");
    }

    @Test
    void uploadPaymentProofWrapsStorageFailure() throws IOException {
        UserEntity user = TestData.activeUser(1);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), user, RegistrationStatus.PENDING_PAYMENT);
        MultipartFile file = new MockMultipartFile("file", "proof.pdf", "application/pdf", "paid".getBytes());
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
        when(storageService.store(eq(StorageContainer.PAYMENT_PROOFS), eq(file), anyString()))
                .thenThrow(new IOException("disk full"));

        assertThatThrownBy(() -> registrationService.uploadPaymentProof(registration.getId(), "REF", file, TestData.principal(user)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to upload payment proof");
    }

    @Test
    void downloadPaymentProofReturnsResource() throws IOException {
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), TestData.activeUser(1), RegistrationStatus.PAYMENT_UPLOADED);
        registration.setPaymentFilePath("payment-proofs/proof.txt");
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
        when(storageService.load("payment-proofs/proof.txt"))
                .thenReturn(new StoredResource(
                        "payment-proofs/proof.txt",
                        "proof.txt",
                        "text/plain",
                        4,
                        new ByteArrayResource("paid".getBytes())
                ));

        ResponseEntity<Resource> response = registrationService.downloadPaymentProof(registration.getId());

        assertThat(response.getBody()).isNotNull();
        assertThat(response.getHeaders().getFirst("Content-Disposition")).contains("proof.txt");
    }

    @Test
    void downloadPaymentProofRejectsMissingRegistration() {
        when(registrationRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.downloadPaymentProof(TestData.uuid(99)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Registration not found");
    }

    @Test
    void downloadPaymentProofRejectsRegistrationWithoutProof() {
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), TestData.activeUser(1), RegistrationStatus.PENDING_PAYMENT);
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> registrationService.downloadPaymentProof(registration.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("No payment proof uploaded");
    }

    @Test
    void downloadPaymentProofWrapsMissingFile() {
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), TestData.activeUser(1), RegistrationStatus.PAYMENT_UPLOADED);
        registration.setPaymentFilePath("payment-proofs/missing-proof-file.txt");
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
        try {
            when(storageService.load("payment-proofs/missing-proof-file.txt")).thenThrow(new IOException("missing"));
        } catch (IOException exception) {
            throw new AssertionError(exception);
        }

        assertThatThrownBy(() -> registrationService.downloadPaymentProof(registration.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to download payment proof");
    }

    @Test
    void approveConfirmsRegistrationAndGeneratesQrToken() {
        UserEntity approver = TestData.activeUser(9);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), TestData.activeUser(1), RegistrationStatus.PAYMENT_UPLOADED);
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
        when(registrationRepository.save(registration)).thenReturn(registration);

        RegistrationResponse response = registrationService.approve(registration.getId(), new RegistrationApprovalRequest("ok"), TestData.principal(approver));

        assertThat(response.status()).isEqualTo("CONFIRMED");
        assertThat(response.approvedById()).isEqualTo(approver.getId());
        assertThat(response.qrToken()).isNotBlank();
        assertThat(response.remarks()).isEqualTo("ok");
    }

    @Test
    void approveKeepsExistingQrToken() {
        UserEntity approver = TestData.activeUser(9);
        RegistrationEntity registration = TestData.registration(2, TestData.event(3, null, null), TestData.activeUser(1), RegistrationStatus.PAYMENT_UPLOADED);
        registration.setQrToken("existing");
        when(registrationRepository.findById(registration.getId())).thenReturn(Optional.of(registration));
        when(registrationRepository.save(registration)).thenReturn(registration);

        RegistrationResponse response = registrationService.approve(registration.getId(), new RegistrationApprovalRequest("ok"), TestData.principal(approver));

        assertThat(response.qrToken()).isEqualTo("existing");
    }

    @Test
    void approveRejectsMissingRegistration() {
        when(registrationRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> registrationService.approve(TestData.uuid(99), new RegistrationApprovalRequest("ok"), TestData.principal(TestData.activeUser(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Registration not found");
    }
}
