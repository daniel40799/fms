package com.fapor7.fms.events;

/**
 * Lifecycle states for event visibility and administration.
 *
 * <p>New events start as {@link #DRAFT}, can be exposed as
 * {@link #PUBLISHED}, and remain available for records after being
 * {@link #ARCHIVED}.</p>
 */
public enum EventStatus {
    DRAFT,
    PUBLISHED,
    ARCHIVED
}
