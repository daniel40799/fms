package com.fapor7.fms.storage;

/**
 * Metadata for a stored upload.
 *
 * @param reference stable storage reference, formatted as {@code container/blob-name}
 * @param filename stored filename/blob name
 * @param contentType uploaded content type when supplied by the client
 * @param contentLength uploaded size in bytes
 */
public record StoredFile(
        String reference,
        String filename,
        String contentType,
        long contentLength
) {
}
