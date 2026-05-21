package com.fapor7.fms.registrations;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.registrations.dto.RegistrationCreateRequest;
import com.fapor7.fms.registrations.dto.RegistrationResponse;
import org.jspecify.annotations.NonNull;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.fapor7.fms.registrations.dto.RegistrationApprovalRequest;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import java.util.UUID;

import java.util.List;

/**
 * Exposes participant registration and payment-review endpoints.
 *
 * <p>End users create registrations, upload payment proof, and view their own
 * registrations. Event and main administrators review all registrations,
 * approve payment, generate QR tokens, and download uploaded proofs.</p>
 */
@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    private final RegistrationService registrationService;

    public RegistrationController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    /**
     * Registers the authenticated user for an event.
     *
     * @param request event id selected by the participant
     * @param authenticatedUser participant making the request
     * @return newly created registration in pending-payment status
     */
    @PostMapping
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('END_USER')")
    public RegistrationResponse register(
            @RequestBody RegistrationCreateRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return registrationService.register(request, authenticatedUser);
    }

    /**
     * Lists registrations owned by the authenticated participant.
     *
     * @param authenticatedUser current user
     * @return registrations for the current user
     */
    @GetMapping("/me")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('END_USER')")
    public List<RegistrationResponse> myRegistrations(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return registrationService.findMyRegistrations(authenticatedUser);
    }

    /**
     * Lists all registrations for event administration.
     *
     * @return all registration records
     */
    @GetMapping
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN') or hasRole('USER_ADMIN')")
    public List<RegistrationResponse> findAll() {
        return registrationService.findAll();
    }

    /**
     * Stores a participant's proof of payment for administrator review.
     *
     * @param id registration id
     * @param paymentReference reference number or note supplied by the participant
     * @param file uploaded proof-of-payment file
     * @param authenticatedUser current participant
     * @return updated registration with payment upload details
     */
    @PostMapping("/{id}/payment")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('END_USER')")
    public RegistrationResponse uploadPaymentProof(
            @PathVariable UUID id,
            @RequestParam String paymentReference,
            @RequestParam MultipartFile file,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return registrationService.uploadPaymentProof(id, paymentReference, file, authenticatedUser);
    }

    /**
     * Confirms a registration after payment review and creates a QR token if needed.
     *
     * @param id registration id
     * @param request approval remarks
     * @param authenticatedUser administrator approving the registration
     * @return confirmed registration with QR metadata
     */
    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN')")
    public RegistrationResponse approve(
            @PathVariable UUID id,
            @RequestBody RegistrationApprovalRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return registrationService.approve(id, request, authenticatedUser);
    }

    /**
     * Downloads a payment proof file attached to a registration.
     *
     * @param id registration id
     * @return file resource response
     */
    @GetMapping("/{id}/payment-proof")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN')")
    public ResponseEntity<@NonNull Resource> downloadPaymentProof(@PathVariable UUID id) {
        return registrationService.downloadPaymentProof(id);
    }
}
