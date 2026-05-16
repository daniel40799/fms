package com.fapor7.fms.events;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.events.dto.EventCreateRequest;
import com.fapor7.fms.events.dto.EventResponse;
import com.fapor7.fms.events.dto.EventUpdateRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Exposes event discovery and event administration endpoints.
 *
 * <p>Any authenticated user can view events. Main administrators and event
 * administrators can create events, edit schedules and capacity, and archive
 * events that should no longer be active.</p>
 */
@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    /**
     * Lists all events currently stored in the system.
     *
     * @return event summaries and scheduling details
     */
    @GetMapping
    public List<EventResponse> findAll() {
        return eventService.findAll();
    }

    /**
     * Retrieves a single event by id.
     *
     * @param id event id
     * @return matching event details
     */
    @GetMapping("/{id}")
    public EventResponse findById(@PathVariable UUID id) {
        return eventService.findById(id);
    }

    /**
     * Creates a draft event owned by the authenticated administrator.
     *
     * @param request event metadata, schedule, capacity, and organization data
     * @param authenticatedUser current administrator creating the event
     * @return created event response
     */
    @PostMapping
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN')")
    public EventResponse create(
            @RequestBody EventCreateRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return eventService.create(request, authenticatedUser);
    }

    /**
     * Updates event metadata and optional lifecycle status.
     *
     * @param id event id to update
     * @param request replacement event details
     * @return updated event response
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN')")
    public EventResponse update(
            @PathVariable UUID id,
            @RequestBody EventUpdateRequest request
    ) {
        return eventService.update(id, request);
    }

    /**
     * Marks an event as archived without deleting historical records.
     *
     * @param id event id to archive
     * @return archived event response
     */
    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN')")
    public EventResponse archive(@PathVariable UUID id) {
        return eventService.archive(id);
    }
}
