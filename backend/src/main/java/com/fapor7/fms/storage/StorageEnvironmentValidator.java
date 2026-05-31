package com.fapor7.fms.storage;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Fails fast when non-local profiles cannot use durable Blob Storage.
 */
@Component
@Profile({"dev", "prod"})
public class StorageEnvironmentValidator implements ApplicationRunner {

    private static final String AZURE_CONTAINER_NAME_PATTERN = "^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$";

    private final StorageProperties properties;

    public StorageEnvironmentValidator(StorageProperties properties) {
        this.properties = properties;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> errors = new ArrayList<>();

        if (properties.getType() != StorageProperties.StorageType.AZURE_BLOB) {
            errors.add("APP_STORAGE_TYPE must be azure-blob for dev/prod uploads");
        }

        if (!properties.hasAzureCredentials()) {
            errors.add("AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT_NAME/AZURE_STORAGE_ACCOUNT_KEY must be configured");
        }

        requireContainer(StorageContainer.PAYMENT_PROOFS, "AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS", errors);
        requireContainer(StorageContainer.PROFILE_PICTURES, "AZURE_STORAGE_CONTAINER_PROFILE_PICTURES", errors);
        requireContainer(StorageContainer.EVENT_RESOURCES, "AZURE_STORAGE_CONTAINER_EVENT_RESOURCES", errors);
        requireContainer(StorageContainer.CERTIFICATES, "AZURE_STORAGE_CONTAINER_CERTIFICATES", errors);

        if (!errors.isEmpty()) {
            throw new IllegalStateException("Unsafe storage configuration: " + String.join("; ", errors));
        }
    }

    private void requireContainer(StorageContainer container, String envName, List<String> errors) {
        String containerName = properties.azureContainerName(container);
        if (containerName == null || containerName.isBlank()) {
            errors.add(envName + " must be configured");
            return;
        }

        if (!containerName.matches(AZURE_CONTAINER_NAME_PATTERN) || containerName.contains("--")) {
            errors.add(envName + " must be a valid Azure Blob container name");
        }
    }
}
