package com.fapor7.fms.storage;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Storage boundary for uploaded files.
 */
public interface StorageService {

    StoredFile store(StorageContainer container, MultipartFile file, String filename) throws IOException;

    StoredResource load(String reference) throws IOException;

    StoredResource load(StorageContainer container, String filename) throws IOException;

    String publicUrl(StorageContainer container, String filename);

    void delete(String reference) throws IOException;

    void delete(StorageContainer container, String filename) throws IOException;
}
