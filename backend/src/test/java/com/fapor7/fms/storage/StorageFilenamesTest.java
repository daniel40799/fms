package com.fapor7.fms.storage;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class StorageFilenamesTest {

    @Test
    void stripsPathsAndUnsafeCharacters() {
        assertThat(StorageFilenames.sanitize("../Proof of Payment #1.pdf")).isEqualTo("Proof_of_Payment_1.pdf");
        assertThat(StorageFilenames.sanitize("..\\avatar.png")).isEqualTo("avatar.png");
    }

    @Test
    void fallsBackForBlankNames() {
        assertThat(StorageFilenames.sanitize("")).isEqualTo("file");
        assertThat(StorageFilenames.sanitize("..")).isEqualTo("file");
    }
}
