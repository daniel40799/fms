package com.fapor7.fms.storage;

import com.azure.storage.blob.BlobClient;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobProperties;
import com.azure.storage.common.StorageSharedKeyCredential;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.InputStreamResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.NoSuchFileException;

/**
 * Azure Blob Storage implementation for non-local uploads.
 */
@Service
@ConditionalOnProperty(name = "app.storage.type", havingValue = "azure-blob")
public class AzureBlobStorageService implements StorageService {

    private static final String UPLOADS_URL_PREFIX = "/uploads/";

    private final StorageProperties properties;
    private final BlobServiceClient blobServiceClient;

    public AzureBlobStorageService(StorageProperties properties) {
        this(properties, buildClient(properties));
    }

    AzureBlobStorageService(StorageProperties properties, BlobServiceClient blobServiceClient) {
        this.properties = properties;
        this.blobServiceClient = blobServiceClient;
    }

    @Override
    public StoredFile store(StorageContainer container, MultipartFile file, String filename) throws IOException {
        requireFile(file);
        String containerName = properties.azureContainerName(container);
        String blobName = StorageFilenames.sanitize(filename);
        BlobClient blobClient = containerClient(containerName).getBlobClient(blobName);

        try (InputStream inputStream = file.getInputStream()) {
            blobClient.upload(inputStream, file.getSize(), true);
            if (file.getContentType() != null && !file.getContentType().isBlank()) {
                blobClient.setHttpHeaders(new BlobHttpHeaders().setContentType(file.getContentType()));
            }
        } catch (RuntimeException exception) {
            throw new IOException("Failed to store blob", exception);
        }

        return new StoredFile(reference(containerName, blobName), blobName, file.getContentType(), file.getSize());
    }

    @Override
    public StoredResource load(String reference) throws IOException {
        StorageReference storageReference = StorageReference.parse(reference)
                .orElseThrow(() -> new IOException("Invalid storage reference"));
        return load(storageReference.containerName(), storageReference.blobName());
    }

    @Override
    public StoredResource load(StorageContainer container, String filename) throws IOException {
        return load(properties.azureContainerName(container), StorageFilenames.sanitize(filename));
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
        try {
            blobClient(storageReference.containerName(), storageReference.blobName()).deleteIfExists();
        } catch (RuntimeException exception) {
            throw new IOException("Failed to delete blob", exception);
        }
    }

    @Override
    public void delete(StorageContainer container, String filename) throws IOException {
        try {
            blobClient(properties.azureContainerName(container), StorageFilenames.sanitize(filename)).deleteIfExists();
        } catch (RuntimeException exception) {
            throw new IOException("Failed to delete blob", exception);
        }
    }

    private StoredResource load(String containerName, String blobName) throws IOException {
        try {
            BlobClient blobClient = blobClient(containerName, blobName);
            if (!blobClient.exists()) {
                throw new NoSuchFileException(reference(containerName, blobName));
            }

            BlobProperties blobProperties = blobClient.getProperties();
            Resource resource = new InputStreamResource(blobClient.openInputStream()) {
                @Override
                public String getFilename() {
                    return blobName;
                }

                @Override
                public long contentLength() {
                    return blobProperties.getBlobSize();
                }
            };

            return new StoredResource(
                    reference(containerName, blobName),
                    blobName,
                    blobProperties.getContentType(),
                    blobProperties.getBlobSize(),
                    resource
            );
        } catch (NoSuchFileException exception) {
            throw exception;
        } catch (RuntimeException exception) {
            throw new IOException("Failed to load blob", exception);
        }
    }

    private BlobClient blobClient(String containerName, String blobName) {
        return containerClient(containerName).getBlobClient(blobName);
    }

    private BlobContainerClient containerClient(String containerName) {
        return blobServiceClient.getBlobContainerClient(containerName);
    }

    private static BlobServiceClient buildClient(StorageProperties properties) {
        StorageProperties.Azure azure = properties.getAzure();
        if (hasText(azure.getConnectionString())) {
            return new BlobServiceClientBuilder()
                    .connectionString(azure.getConnectionString())
                    .buildClient();
        }

        if (hasText(azure.getAccountName()) && hasText(azure.getAccountKey())) {
            StorageSharedKeyCredential credential = new StorageSharedKeyCredential(
                    azure.getAccountName(),
                    azure.getAccountKey()
            );
            return new BlobServiceClientBuilder()
                    .endpoint("https://" + azure.getAccountName() + ".blob.core.windows.net")
                    .credential(credential)
                    .buildClient();
        }

        throw new IllegalStateException("Azure Blob Storage credentials are required");
    }

    private static void requireFile(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IOException("Upload file is required");
        }
    }

    private static String reference(String containerName, String blobName) {
        return containerName + "/" + blobName;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
