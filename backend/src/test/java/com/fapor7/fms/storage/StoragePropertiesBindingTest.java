package com.fapor7.fms.storage;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Bindable;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

class StoragePropertiesBindingTest {

    @Test
    void bindsAzureBlobStorageTypeAndContainerNames() {
        MapConfigurationPropertySource source = new MapConfigurationPropertySource();
        source.put("app.storage.type", "azure-blob");
        source.put("app.storage.azure.connection-string", "UseDevelopmentStorage=true");
        source.put("app.storage.azure.containers.payment-proofs", "payment-proofs");
        source.put("app.storage.azure.containers.profile-pictures", "profile-pictures");
        source.put("app.storage.azure.containers.event-resources", "event-resources");
        source.put("app.storage.azure.containers.certificates", "certificates");

        StorageProperties properties = new Binder(source)
                .bind("app.storage", Bindable.of(StorageProperties.class))
                .orElseThrow(() -> new AssertionError("Storage properties did not bind"));

        assertThat(properties.getType()).isEqualTo(StorageProperties.StorageType.AZURE_BLOB);
        assertThat(properties.hasAzureCredentials()).isTrue();
        assertThat(properties.azureContainerName(StorageContainer.PAYMENT_PROOFS)).isEqualTo("payment-proofs");
        assertThat(properties.azureContainerName(StorageContainer.PROFILE_PICTURES)).isEqualTo("profile-pictures");
        assertThat(properties.azureContainerName(StorageContainer.EVENT_RESOURCES)).isEqualTo("event-resources");
        assertThat(properties.azureContainerName(StorageContainer.CERTIFICATES)).isEqualTo("certificates");
    }

    @Test
    void leavesAzureContainerNamesBlankWhenEnvironmentDoesNotSetThem() {
        MapConfigurationPropertySource source = new MapConfigurationPropertySource();
        source.put("app.storage.type", "azure-blob");
        source.put("app.storage.azure.connection-string", "UseDevelopmentStorage=true");

        StorageProperties properties = new Binder(source)
                .bind("app.storage", Bindable.of(StorageProperties.class))
                .orElseThrow(() -> new AssertionError("Storage properties did not bind"));

        assertThat(properties.getType()).isEqualTo(StorageProperties.StorageType.AZURE_BLOB);
        assertThat(properties.azureContainerName(StorageContainer.PAYMENT_PROOFS)).isNull();
        assertThat(properties.azureContainerName(StorageContainer.PROFILE_PICTURES)).isNull();
    }
}
