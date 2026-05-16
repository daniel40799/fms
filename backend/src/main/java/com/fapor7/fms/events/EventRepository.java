package com.fapor7.fms.events;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Spring Data repository for event CRUD operations.
 *
 * <p>Events are referenced by registrations, attendance logs, and future event
 * resource or certificate features.</p>
 */
public interface EventRepository extends JpaRepository<EventEntity, UUID> {
}
