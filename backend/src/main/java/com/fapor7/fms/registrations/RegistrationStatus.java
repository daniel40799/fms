package com.fapor7.fms.registrations;

/**
 * Lifecycle states for event registration and payment review.
 *
 * <p>Registrations start as pending payment, move to uploaded payment proof,
 * become confirmed after administrator approval, or may be cancelled.</p>
 */
public enum RegistrationStatus {
    PENDING_PAYMENT,
    PAYMENT_UPLOADED,
    CONFIRMED,
    CANCELLED
}
