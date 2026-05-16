package com.fapor7.fms.roles;

/**
 * Role names used for authorization decisions across the backend.
 *
 * <p>The roles mirror the FAPOR7 operating model: main administration, user
 * administration, event administration, organization administration, exhibitor
 * engagement, and standard end-user participation.</p>
 */
public enum RoleName {
    MAIN_ADMIN,
    USER_ADMIN,
    EVENT_ADMIN,
    ORGANIZATION_ADMIN,
    EXHIBITOR,
    END_USER
}
