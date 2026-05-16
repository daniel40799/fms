package com.fapor7.fms.events;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.events.dto.EventCreateRequest;
import com.fapor7.fms.events.dto.EventResponse;
import com.fapor7.fms.events.dto.EventUpdateRequest;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.users.UserEntity;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Coordinates event business operations.
 *
 * <p>The service creates draft events, validates optional organization links,
 * updates event configuration, archives events, and maps persisted events to
 * API response records for the frontend.</p>
 */
@Service
public class EventService {

    private final EventRepository eventRepository;
    private final OrganizationRepository organizationRepository;

    public EventService(
            EventRepository eventRepository,
            OrganizationRepository organizationRepository
    ) {
        this.eventRepository = eventRepository;
        this.organizationRepository = organizationRepository;
    }

    /**
     * Returns all events.
     *
     * @return list of event response DTOs
     */
    public List<EventResponse> findAll() {
        return eventRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Finds one event by id.
     *
     * @param id event id
     * @return event response for the matching record
     * @throws RuntimeException when the event does not exist
     */
    public EventResponse findById(UUID id) {
        return eventRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("Event not found"));
    }

    /**
     * Creates a new draft event.
     *
     * @param request event details submitted by an administrator
     * @param authenticatedUser administrator creating the event
     * @return created event response
     * @throws RuntimeException when the referenced organization does not exist
     */
    public EventResponse create(EventCreateRequest request, AuthenticatedUser authenticatedUser) {
        OrganizationEntity organization = null;

        if (request.organizationId() != null) {
            organization = organizationRepository.findById(request.organizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
        }

        UserEntity currentUser = authenticatedUser.getUser();

        EventEntity event = new EventEntity();
        event.setId(UUID.randomUUID());
        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setVenue(request.venue());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setCapacity(request.capacity());
        event.setRegistrationOpen(request.registrationOpen());
        event.setRegistrationClose(request.registrationClose());
        event.setStatus(EventStatus.DRAFT);
        event.setOrganization(organization);
        event.setCreatedBy(currentUser);
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());

        return toResponse(eventRepository.save(event));
    }

    /**
     * Replaces editable event fields and optionally changes status.
     *
     * @param id event id to update
     * @param request updated event data
     * @return updated event response
     * @throws RuntimeException when the event or organization is not found
     */
    public EventResponse update(UUID id, EventUpdateRequest request) {
        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        OrganizationEntity organization = null;

        if (request.organizationId() != null) {
            organization = organizationRepository.findById(request.organizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
        }

        event.setTitle(request.title());
        event.setDescription(request.description());
        event.setVenue(request.venue());
        event.setStartDate(request.startDate());
        event.setEndDate(request.endDate());
        event.setCapacity(request.capacity());
        event.setRegistrationOpen(request.registrationOpen());
        event.setRegistrationClose(request.registrationClose());
        event.setOrganization(organization);

        if (request.status() != null) {
            event.setStatus(EventStatus.valueOf(request.status()));
        }

        event.setUpdatedAt(LocalDateTime.now());

        return toResponse(eventRepository.save(event));
    }

    /**
     * Archives an event while keeping related historical records available.
     *
     * @param id event id to archive
     * @return archived event response
     * @throws RuntimeException when the event does not exist
     */
    public EventResponse archive(UUID id) {
        EventEntity event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        event.setStatus(EventStatus.ARCHIVED);
        event.setUpdatedAt(LocalDateTime.now());

        return toResponse(eventRepository.save(event));
    }

    /**
     * Maps an event entity into the API response shape.
     *
     * @param event persisted event
     * @return event response with organization and creator display fields
     */
    private EventResponse toResponse(EventEntity event) {
        return new EventResponse(
                event.getId(),
                event.getTitle(),
                event.getDescription(),
                event.getVenue(),
                event.getStartDate(),
                event.getEndDate(),
                event.getCapacity(),
                event.getRegistrationOpen(),
                event.getRegistrationClose(),
                event.getStatus().name(),
                event.getOrganization() != null ? event.getOrganization().getId() : null,
                event.getOrganization() != null ? event.getOrganization().getName() : null,
                event.getCreatedBy() != null ? event.getCreatedBy().getId() : null,
                event.getCreatedBy() != null ? event.getCreatedBy().getFullName() : null
        );
    }
}
