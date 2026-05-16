package com.fapor7.fms.events;

import org.springframework.data.jpa.repository.JpaRepository;
import org.jspecify.annotations.NonNull;

import java.util.UUID;

/**
 * Spring Data repository for event CRUD operations.
 *
 * <p>Events are referenced by registrations, attendance logs, and future event
 * resource or certificate features.</p>
 */
public interface EventRepository extends JpaRepository<@NonNull EventEntity, @NonNull UUID> {
}
