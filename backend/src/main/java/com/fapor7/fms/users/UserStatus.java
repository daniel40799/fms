package com.fapor7.fms.users;

/**
 * Account lifecycle states.
 *
 * <p>Only {@link #ACTIVE} users may log in. Pending and inactive users remain
 * stored for administrative tracking but are blocked by authentication.</p>
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    PENDING
}
