package com.fapor7.fms.storage;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

/**
 * Filesystem-backed storage for local development.
 */
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final String UPLOADS_URL_PREFIX = "/uploads/";

    private final Path basePath;

    public LocalStorageService(StorageProperties properties) {
        this.basePath = resolveBasePath(properties.getLocal().getBasePath());
    }

    LocalStorageService(Path basePath) {
        this.basePath = basePath;
    }

    @Override
    public StoredFile store(StorageContainer container, MultipartFile file, String filename) throws IOException {
        requireFile(file);
        StorageReference reference = StorageReference.of(container, filename);
        Path uploadDir = basePath.resolve(reference.containerName()).toAbsolutePath().normalize();
        Files.createDirectories(uploadDir);

        Path targetPath = uploadDir.resolve(reference.blobName()).normalize();
        if (!targetPath.startsWith(uploadDir)) {
            throw new IOException("Invalid upload filename");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        return new StoredFile(
                reference.reference(),
                reference.blobName(),
                file.getContentType(),
                file.getSize()
        );
    }

    @Override
    public StoredResource load(String reference) throws IOException {
        StorageReference storageReference = legacyReference(reference)
                .or(() -> StorageReference.parse(reference))
                .orElseThrow(() -> new IOException("Invalid storage reference"));
        return load(storageReference);
    }

    @Override
    public StoredResource load(StorageContainer container, String filename) throws IOException {
        return load(StorageReference.of(container, filename));
    }

    @Override
    public String publicUrl(StorageContainer container, String filename) {
        StorageReference reference = StorageReference.of(container, filename);
        return UPLOADS_URL_PREFIX + reference.reference();
    }

    @Override
    public void delete(String reference) throws IOException {
        StorageReference storageReference = StorageReference.parse(reference)
                .orElseThrow(() -> new IOException("Invalid storage reference"));
        Path filePath = resolvePath(storageReference);
        Files.deleteIfExists(filePath);
    }

    @Override
    public void delete(StorageContainer container, String filename) throws IOException {
        Files.deleteIfExists(resolvePath(StorageReference.of(container, filename)));
    }

    private StoredResource load(StorageReference reference) throws IOException {
        Path filePath = resolvePath(reference);
        if (!Files.exists(filePath) || !Files.isRegularFile(filePath)) {
            throw new NoSuchFileException(reference.reference());
        }

        Resource resource = new UrlResource(filePath.toUri());
        return new StoredResource(
                reference.reference(),
                reference.blobName(),
                Files.probeContentType(filePath),
                Files.size(filePath),
                resource
        );
    }

    private Path resolvePath(StorageReference reference) throws IOException {
        Path containerDir = basePath.resolve(reference.containerName()).toAbsolutePath().normalize();
        Path filePath = containerDir.resolve(reference.blobName()).normalize();
        if (!filePath.startsWith(containerDir)) {
            throw new IOException("Invalid storage reference");
        }

        return filePath;
    }

    private Optional<StorageReference> legacyReference(String reference) {
        if (reference == null || reference.isBlank()) {
            return Optional.empty();
        }

        Path path = Path.of(reference).normalize();
        Path normalizedBasePath = basePath.toAbsolutePath().normalize();
        Path absolutePath = path.isAbsolute()
                ? path.toAbsolutePath().normalize()
                : Path.of("").toAbsolutePath().normalize().resolve(path).normalize();

        if (!absolutePath.startsWith(normalizedBasePath) || absolutePath.getNameCount() < normalizedBasePath.getNameCount() + 2) {
            return Optional.empty();
        }

        Path relativePath = normalizedBasePath.relativize(absolutePath);
        String containerName = relativePath.getName(0).toString();
        String blobName = relativePath.subpath(1, relativePath.getNameCount()).toString().replace('\\', '/');
        return StorageReference.parse(containerName + "/" + blobName);
    }

    private Path resolveBasePath(String value) {
        if (value == null || value.isBlank()) {
            return Path.of("uploads");
        }

        return Path.of(value);
    }

    private void requireFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("Upload file is required");
        }
    }
}
