package com.fapor7.fms.storage;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProfilePictureControllerTest {

    private final StorageService storageService = mock(StorageService.class);
    private final ProfilePictureController controller = new ProfilePictureController(storageService);

    @Test
    void streamsProfilePicturesFromStorage() throws IOException {
        when(storageService.load(StorageContainer.PROFILE_PICTURES, "avatar.png"))
                .thenReturn(new StoredResource(
                        "profile-pictures/avatar.png",
                        "avatar.png",
                        "image/png",
                        5,
                        new ByteArrayResource("image".getBytes())
                ));

        ResponseEntity<Resource> response = controller.getProfilePicture("avatar.png");

        assertThat(response.getHeaders().getContentType().toString()).isEqualTo("image/png");
        assertThat(response.getHeaders().getContentLength()).isEqualTo(5);
        assertThat(response.getBody()).isNotNull();
    }

    @Test
    void returnsNotFoundForMissingProfilePictures() throws IOException {
        when(storageService.load(StorageContainer.PROFILE_PICTURES, "missing.png"))
                .thenThrow(new IOException("missing"));

        assertThatThrownBy(() -> controller.getProfilePicture("missing.png"))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Profile picture not found");
    }
}
