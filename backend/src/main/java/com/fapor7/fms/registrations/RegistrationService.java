package com.fapor7.fms.registrations;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.events.EventRepository;
import com.fapor7.fms.events.EventStatus;
import com.fapor7.fms.registrations.dto.RegistrationCreateRequest;
import com.fapor7.fms.registrations.dto.RegistrationResponse;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserOrganizationStatus;
import org.jspecify.annotations.NonNull;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.fapor7.fms.registrations.dto.RegistrationApprovalRequest;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Files;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import java.nio.file.Path;

/**
 * Implements event registration, payment proof, approval, and QR workflows.
 *
 * <p>The service ensures each user registers only once per event, stores manual
 * payment proof files, restricts uploads to the registration owner, confirms
 * registrations after administrator review, and generates QR tokens used for
 * attendance check-in.</p>
 */
@Service
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final Path uploadBasePath;

    public RegistrationService(
            RegistrationRepository registrationRepository,
            EventRepository eventRepository,
            @Value("${app.upload.base-path:uploads}") String uploadBasePath
    ) {
        this.registrationRepository = registrationRepository;
        this.eventRepository = eventRepository;
        this.uploadBasePath = resolveUploadBasePath(uploadBasePath);
    }

    /**
     * Creates a pending-payment registration for the current user.
     *
     * @param request event id selected by the participant
     * @param authenticatedUser current participant
     * @return created registration response
     * @throws RuntimeException when the event does not exist or the user is already registered
     */
    public RegistrationResponse register(
            RegistrationCreateRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        UserEntity user = authenticatedUser.getUser();

        if (isInternalFapor7User(user)) {
            throw new RuntimeException("FAPOR7 organization users cannot register for events");
        }

        EventEntity event = eventRepository.findById(request.eventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));

        if (event.getStatus() != EventStatus.PUBLISHED) {
            throw new RuntimeException("Only published events accept registrations");
        }

        registrationRepository.findByEventIdAndUserId(event.getId(), user.getId())
                .ifPresent(existing -> {
                    throw new RuntimeException("User is already registered to this event");
                });

        RegistrationEntity registration = new RegistrationEntity();
        registration.setId(UUID.randomUUID());
        registration.setEvent(event);
        registration.setUser(user);
        registration.setStatus(RegistrationStatus.PENDING_PAYMENT);
        registration.setRegisteredAt(LocalDateTime.now());
        registration.setUpdatedAt(LocalDateTime.now());

        return toResponse(registrationRepository.save(registration));
    }

    /**
     * Returns registrations owned by the current user.
     *
     * @param authenticatedUser current participant
     * @return current user's registrations
     */
    public List<RegistrationResponse> findMyRegistrations(AuthenticatedUser authenticatedUser) {
        UserEntity user = authenticatedUser.getUser();
        if (isInternalFapor7User(user)) {
            return List.of();
        }

        UUID userId = user.getId();

        return registrationRepository.findAll()
                .stream()
                .filter(registration -> registration.getUser().getId().equals(userId))
                .map(this::toResponse)
                .toList();
    }

    /**
     * Returns all registration records for administrators.
     *
     * @return all registrations mapped to API responses
     */
    public List<RegistrationResponse> findAll() {
        return registrationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Saves an uploaded proof-of-payment file and marks the registration for review.
     *
     * @param registrationId registration receiving the payment proof
     * @param paymentReference user-supplied payment reference
     * @param file uploaded proof file
     * @param authenticatedUser current user, who must own the registration
     * @return updated registration response
     * @throws RuntimeException when the registration is missing, owned by another user, or file storage fails
     */
    public RegistrationResponse uploadPaymentProof(
            UUID registrationId,
            String paymentReference,
            MultipartFile file,
            AuthenticatedUser authenticatedUser
    ) {
        RegistrationEntity registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        UUID currentUserId = authenticatedUser.getUser().getId();

        if (!registration.getUser().getId().equals(currentUserId)) {
            throw new RuntimeException("You can only upload payment proof for your own registration");
        }

        try {
            Path uploadDir = uploadBasePath.resolve("payment-proofs").normalize();
            Files.createDirectories(uploadDir);

            String originalFilename = file.getOriginalFilename();
            String safeFilename = registrationId + "_" + System.currentTimeMillis() + "_" + originalFilename;

            Path targetPath = uploadDir.resolve(safeFilename);
            Files.copy(file.getInputStream(), targetPath);

            registration.setPaymentReference(paymentReference);
            registration.setPaymentFilePath(targetPath.toString());
            registration.setPaymentUploadedAt(LocalDateTime.now());
            registration.setStatus(RegistrationStatus.PAYMENT_UPLOADED);
            registration.setUpdatedAt(LocalDateTime.now());

            return toResponse(registrationRepository.save(registration));
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload payment proof", e);
        }
    }

    /**
     * Streams the stored proof-of-payment file for administrator review.
     *
     * @param registrationId registration id
     * @return response containing the uploaded file resource
     * @throws RuntimeException when no proof exists or the file cannot be read
     */
    public ResponseEntity<@NonNull Resource> downloadPaymentProof(UUID registrationId) {
        RegistrationEntity registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        if (registration.getPaymentFilePath() == null) {
            throw new RuntimeException("No payment proof uploaded");
        }

        try {
            Path filePath = Path.of(registration.getPaymentFilePath());
            Resource resource = new org.springframework.core.io.UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new RuntimeException("Payment proof file not found");
            }

            return ResponseEntity.ok()
                    .header(
                            "Content-Disposition",
                            "attachment; filename=\"" + filePath.getFileName() + "\""
                    )
                    .body(resource);
        } catch (Exception e) {
            throw new RuntimeException("Failed to download payment proof", e);
        }
    }

    /**
     * Confirms a registration and generates its QR token if one does not exist.
     *
     * @param registrationId registration to approve
     * @param request approval remarks
     * @param authenticatedUser administrator approving the registration
     * @return confirmed registration response
     * @throws RuntimeException when the registration is missing
     */
    public RegistrationResponse approve(
            UUID registrationId,
            RegistrationApprovalRequest request,
            AuthenticatedUser authenticatedUser
    ) {
        RegistrationEntity registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        registration.setStatus(RegistrationStatus.CONFIRMED);
        registration.setApprovedBy(authenticatedUser.getUser());
        registration.setApprovedAt(LocalDateTime.now());
        registration.setRemarks(request.remarks());

        if (registration.getQrToken() == null) {
            registration.setQrToken(UUID.randomUUID().toString());
            registration.setQrGeneratedAt(LocalDateTime.now());
        }

        registration.setUpdatedAt(LocalDateTime.now());
        return toResponse(registrationRepository.save(registration));
    }

    /**
     * Maps a registration entity into the API response shape.
     *
     * @param registration persisted registration
     * @return registration response with payment, approval, and QR fields
     */
    private RegistrationResponse toResponse(RegistrationEntity registration) {
        return new RegistrationResponse(
                registration.getId(),
                registration.getEvent().getId(),
                registration.getEvent().getTitle(),
                registration.getUser().getId(),
                registration.getUser().getFullName(),
                registration.getStatus().name(),
                registration.getRegisteredAt(),
                registration.getPaymentReference(),
                registration.getPaymentFilePath(),
                registration.getPaymentUploadedAt(),
                registration.getApprovedBy() != null ? registration.getApprovedBy().getId() : null,
                registration.getApprovedBy() != null ? registration.getApprovedBy().getFullName() : null,
                registration.getApprovedAt(),
                registration.getRemarks(),
                registration.getQrToken(),
                registration.getQrGeneratedAt()
        );
    }

    private boolean isInternalFapor7User(UserEntity user) {
        return user.getOrganizationMemberships()
                .stream()
                .anyMatch(membership -> membership.getStatus() != UserOrganizationStatus.REJECTED
                        && "FAPOR7".equalsIgnoreCase(membership.getOrganization().getCode()))
                || (user.getOrganization() != null
                && "FAPOR7".equalsIgnoreCase(user.getOrganization().getCode()));
    }

    private Path resolveUploadBasePath(String value) {
        if (value == null || value.isBlank()) {
            return Path.of("uploads");
        }

        return Path.of(value);
    }

}
