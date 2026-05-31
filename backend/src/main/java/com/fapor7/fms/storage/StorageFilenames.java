package com.fapor7.fms.storage;

import java.util.Locale;

/**
 * Filename normalization shared by storage callers and implementations.
 */
public final class StorageFilenames {

    private static final int MAX_FILENAME_LENGTH = 120;

    private StorageFilenames() {
    }

    public static String sanitize(String filename) {
        if (filename == null || filename.isBlank()) {
            return "file";
        }

        String basename = filename.replace('\\', '/');
        int slashIndex = basename.lastIndexOf('/');
        if (slashIndex >= 0) {
            basename = basename.substring(slashIndex + 1);
        }

        basename = basename.trim()
                .replaceAll("[^A-Za-z0-9._-]", "_")
                .replaceAll("_+", "_");

        while (basename.startsWith(".")) {
            basename = basename.substring(1);
        }

        if (basename.isBlank() || basename.equals(".") || basename.equals("..")) {
            basename = "file";
        }

        if (basename.length() > MAX_FILENAME_LENGTH) {
            basename = trimPreservingExtension(basename);
        }

        return basename;
    }

    private static String trimPreservingExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        if (dotIndex > 0 && dotIndex < filename.length() - 1) {
            String extension = filename.substring(dotIndex).toLowerCase(Locale.ROOT);
            int basenameLength = Math.max(1, MAX_FILENAME_LENGTH - extension.length());
            return filename.substring(0, Math.min(dotIndex, basenameLength)) + extension;
        }

        return filename.substring(0, MAX_FILENAME_LENGTH);
    }
}
