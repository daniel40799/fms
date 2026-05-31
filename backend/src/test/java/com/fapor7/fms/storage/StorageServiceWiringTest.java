package com.fapor7.fms.storage;

import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StorageServiceWiringTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
            .withUserConfiguration(
                    StorageProperties.class,
                    LocalStorageService.class,
                    AzureBlobStorageService.class,
                    StorageEnvironmentValidator.class
            );

    @Test
    void localStorageTypeCreatesLocalStorageServiceOnly() {
        contextRunner
                .withPropertyValues("app.storage.type=local")
                .run(context -> {
                    assertThat(context).hasSingleBean(StorageService.class);
                    assertThat(context).hasSingleBean(LocalStorageService.class);
                    assertThat(context).doesNotHaveBean(AzureBlobStorageService.class);
                });
    }

    @Test
    void azureBlobStorageTypeCreatesAzureBlobStorageServiceOnly() {
        contextRunner
                .withPropertyValues(
                        "app.storage.type=azure-blob",
                        "app.storage.azure.connection-string=UseDevelopmentStorage=true",
                        "app.storage.azure.containers.payment-proofs=payment-proofs",
                        "app.storage.azure.containers.profile-pictures=profile-pictures",
                        "app.storage.azure.containers.event-resources=event-resources",
                        "app.storage.azure.containers.certificates=certificates"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(StorageService.class);
                    assertThat(context).hasSingleBean(AzureBlobStorageService.class);
                    assertThat(context).doesNotHaveBean(LocalStorageService.class);
                });
    }

    @Test
    void devProfileRegistersStorageValidatorAndRejectsMissingContainers() {
        contextRunner
                .withInitializer(context -> context.getEnvironment().setActiveProfiles("dev"))
                .withPropertyValues(
                        "app.storage.type=azure-blob",
                        "app.storage.azure.connection-string=UseDevelopmentStorage=true"
                )
                .run(context -> {
                    assertThat(context).hasSingleBean(StorageEnvironmentValidator.class);
                    StorageEnvironmentValidator validator = context.getBean(StorageEnvironmentValidator.class);

                    assertThatThrownBy(() -> validator.run(null))
                            .isInstanceOf(IllegalStateException.class)
                            .hasMessageContaining("AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS")
                            .hasMessageContaining("AZURE_STORAGE_CONTAINER_PROFILE_PICTURES")
                            .hasMessageContaining("AZURE_STORAGE_CONTAINER_EVENT_RESOURCES")
                            .hasMessageContaining("AZURE_STORAGE_CONTAINER_CERTIFICATES");
                });
    }

    @Test
    void localProfileDoesNotRegisterStorageValidator() {
        contextRunner
                .withInitializer(context -> context.getEnvironment().setActiveProfiles("local"))
                .withPropertyValues("app.storage.type=local")
                .run(context -> assertThat(context).doesNotHaveBean(StorageEnvironmentValidator.class));
    }
}
