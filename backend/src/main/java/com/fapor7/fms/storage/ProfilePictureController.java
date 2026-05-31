package com.fapor7.fms.storage;

import org.jspecify.annotations.NonNull;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.NOT_FOUND;

/**
 * Streams profile images through the backend so Blob containers can remain private.
 */
@RestController
public class ProfilePictureController {

    private final StorageService storageService;

    public ProfilePictureController(StorageService storageService) {
        this.storageService = storageService;
    }

    @GetMapping("/uploads/profile-pictures/{filename:.+}")
    public ResponseEntity<@NonNull Resource> getProfilePicture(@PathVariable String filename) {
        try {
            StoredResource storedResource = storageService.load(StorageContainer.PROFILE_PICTURES, filename);
            ResponseEntity.BodyBuilder response = ResponseEntity.ok();
            MediaType mediaType = contentType(storedResource.contentType());
            if (mediaType != null) {
                response.contentType(mediaType);
            }
            if (storedResource.contentLength() >= 0) {
                response.contentLength(storedResource.contentLength());
            }
            return response.body(storedResource.resource());
        } catch (Exception exception) {
            throw new ResponseStatusException(NOT_FOUND, "Profile picture not found");
        }
    }

    private MediaType contentType(String contentType) {
        if (contentType == null || contentType.isBlank()) {
            return null;
        }

        try {
            return MediaType.parseMediaType(contentType);
        } catch (Exception exception) {
            return null;
        }
    }
}
