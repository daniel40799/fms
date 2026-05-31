package com.fapor7.fms.storage;

/**
 * Logical upload buckets used by the application.
 */
public enum StorageContainer {

    PAYMENT_PROOFS("payment-proofs"),
    PROFILE_PICTURES("profile-pictures"),
    EVENT_RESOURCES("event-resources"),
    CERTIFICATES("certificates");

    private final String defaultName;

    StorageContainer(String defaultName) {
        this.defaultName = defaultName;
    }

    public String defaultName() {
        return defaultName;
    }
}
