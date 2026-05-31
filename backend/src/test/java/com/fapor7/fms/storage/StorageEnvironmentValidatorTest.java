package com.fapor7.fms.storage;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StorageEnvironmentValidatorTest {

    @Test
    void acceptsAzureBlobStorageWithConnectionString() {
        StorageProperties properties = azurePropertiesWithContainers();
        properties.getAzure().setConnectionString("UseDevelopmentStorage=true");

        StorageEnvironmentValidator validator = new StorageEnvironmentValidator(properties);

        assertThatCode(() -> validator.run(null)).doesNotThrowAnyException();
    }

    @Test
    void acceptsAzureBlobStorageWithAccountKey() {
        StorageProperties properties = azurePropertiesWithContainers();
        properties.getAzure().setAccountName("fmsdevstorage");
        properties.getAzure().setAccountKey("test-key");

        StorageEnvironmentValidator validator = new StorageEnvironmentValidator(properties);

        assertThatCode(() -> validator.run(null)).doesNotThrowAnyException();
    }

    @Test
    void rejectsLocalStorageForNonLocalProfiles() {
        StorageProperties properties = new StorageProperties();
        properties.setType(StorageProperties.StorageType.LOCAL);

        StorageEnvironmentValidator validator = new StorageEnvironmentValidator(properties);

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_STORAGE_TYPE");
    }

    @Test
    void rejectsMissingAzureCredentials() {
        StorageEnvironmentValidator validator = new StorageEnvironmentValidator(azurePropertiesWithContainers());

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AZURE_STORAGE_CONNECTION_STRING");
    }

    @Test
    void rejectsMissingAzureContainers() {
        StorageProperties properties = azureProperties();
        properties.getAzure().setConnectionString("UseDevelopmentStorage=true");

        StorageEnvironmentValidator validator = new StorageEnvironmentValidator(properties);

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS")
                .hasMessageContaining("AZURE_STORAGE_CONTAINER_PROFILE_PICTURES")
                .hasMessageContaining("AZURE_STORAGE_CONTAINER_EVENT_RESOURCES")
                .hasMessageContaining("AZURE_STORAGE_CONTAINER_CERTIFICATES");
    }

    @Test
    void rejectsInvalidAzureContainerNames() {
        StorageProperties properties = azurePropertiesWithContainers();
        properties.getAzure().setConnectionString("UseDevelopmentStorage=true");
        properties.getAzure().getContainers().setPaymentProofs("PaymentProofs");

        StorageEnvironmentValidator validator = new StorageEnvironmentValidator(properties);

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS must be a valid Azure Blob container name");
    }

    @Test
    void localStorageDoesNotRequireAzureCredentialsOrContainers() {
        StorageProperties properties = new StorageProperties();
        properties.setType(StorageProperties.StorageType.LOCAL);

        assertThatCode(() -> new LocalStorageService(properties)).doesNotThrowAnyException();
    }

    private StorageProperties azureProperties() {
        StorageProperties properties = new StorageProperties();
        properties.setType(StorageProperties.StorageType.AZURE_BLOB);
        return properties;
    }

    private StorageProperties azurePropertiesWithContainers() {
        StorageProperties properties = azureProperties();
        properties.getAzure().getContainers().setPaymentProofs("payment-proofs");
        properties.getAzure().getContainers().setProfilePictures("profile-pictures");
        properties.getAzure().getContainers().setEventResources("event-resources");
        properties.getAzure().getContainers().setCertificates("certificates");
        return properties;
    }
}
