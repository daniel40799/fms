package com.fapor7.fms.storage;

import org.springframework.core.io.Resource;

/**
 * Downloadable stored resource and response metadata.
 *
 * @param reference stable storage reference
 * @param filename stored filename/blob name
 * @param contentType detected or stored content type
 * @param contentLength resource size in bytes
 * @param resource Spring resource used for streaming
 */
public record StoredResource(
        String reference,
        String filename,
        String contentType,
        long contentLength,
        Resource resource
) {
}
