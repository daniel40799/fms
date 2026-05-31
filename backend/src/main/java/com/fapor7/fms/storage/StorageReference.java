package com.fapor7.fms.storage;

import java.util.Optional;

record StorageReference(String containerName, String blobName) {

    static Optional<StorageReference> parse(String reference) {
        if (reference == null || reference.isBlank()) {
            return Optional.empty();
        }

        String normalized = reference.trim().replace('\\', '/');
        while (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }

        int slashIndex = normalized.indexOf('/');
        if (slashIndex <= 0 || slashIndex == normalized.length() - 1) {
            return Optional.empty();
        }

        String containerName = normalized.substring(0, slashIndex);
        String blobName = normalized.substring(slashIndex + 1);
        if (!isSafeSegment(containerName) || !isSafeBlobName(blobName)) {
            return Optional.empty();
        }

        return Optional.of(new StorageReference(containerName, blobName));
    }

    static StorageReference of(StorageContainer container, String filename) {
        return new StorageReference(container.defaultName(), StorageFilenames.sanitize(filename));
    }

    String reference() {
        return containerName + "/" + blobName;
    }

    private static boolean isSafeSegment(String value) {
        return !value.isBlank()
                && !value.equals(".")
                && !value.equals("..")
                && value.matches("[A-Za-z0-9][A-Za-z0-9._-]*");
    }

    private static boolean isSafeBlobName(String value) {
        if (value.isBlank() || value.startsWith("/") || value.endsWith("/")) {
            return false;
        }

        for (String segment : value.split("/")) {
            if (!isSafeSegment(segment)) {
                return false;
            }
        }

        return true;
    }
}
