package com.fapor7.fms.storage;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LocalStorageServiceTest {

    @TempDir
    private Path uploadBasePath;

    @Test
    void storesLoadsAndDeletesFilesUnderConfiguredBasePath() throws IOException {
        LocalStorageService storageService = new LocalStorageService(uploadBasePath);
        MockMultipartFile file = new MockMultipartFile("file", "../avatar.png", "image/png", "image".getBytes());

        StoredFile storedFile = storageService.store(StorageContainer.PROFILE_PICTURES, file, "../avatar.png");

        assertThat(storedFile.reference()).isEqualTo("profile-pictures/avatar.png");
        assertThat(storageService.publicUrl(StorageContainer.PROFILE_PICTURES, storedFile.filename()))
                .isEqualTo("/uploads/profile-pictures/avatar.png");
        assertThat(Files.readString(uploadBasePath.resolve("profile-pictures").resolve("avatar.png"))).isEqualTo("image");

        StoredResource storedResource = storageService.load(storedFile.reference());

        assertThat(storedResource.filename()).isEqualTo("avatar.png");
        assertThat(storedResource.contentLength()).isEqualTo(5);

        storageService.delete(storedFile.reference());

        assertThat(uploadBasePath.resolve("profile-pictures").resolve("avatar.png")).doesNotExist();
    }

    @Test
    void loadsLegacyFilesystemReferencesInsideUploadBasePath() throws IOException {
        LocalStorageService storageService = new LocalStorageService(uploadBasePath);
        Path proofPath = uploadBasePath.resolve("payment-proofs").resolve("proof.txt");
        Files.createDirectories(proofPath.getParent());
        Files.writeString(proofPath, "paid");

        StoredResource storedResource = storageService.load(proofPath.toString());

        assertThat(storedResource.reference()).isEqualTo("payment-proofs/proof.txt");
        assertThat(storedResource.filename()).isEqualTo("proof.txt");
    }

    @Test
    void rejectsTraversalReferences() {
        LocalStorageService storageService = new LocalStorageService(uploadBasePath);

        assertThatThrownBy(() -> storageService.load("profile-pictures/../secret.txt"))
                .isInstanceOf(IOException.class);
    }
}
