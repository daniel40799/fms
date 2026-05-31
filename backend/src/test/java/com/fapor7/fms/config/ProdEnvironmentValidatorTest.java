package com.fapor7.fms.config;

import com.fapor7.fms.storage.StorageProperties;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProdEnvironmentValidatorTest {

    private static final String SAFE_SECRET = "prod-secret-at-least-thirty-two-bytes";
    private static final String SAFE_DB_URL = "jdbc:postgresql://fms-prod.postgres.database.azure.com:5432/fms?sslmode=require";
    private static final String SAFE_CORS = "https://fms.example.com,https://admin.fms.example.com";

    @Test
    void acceptsSafeProdConfiguration() {
        ProdEnvironmentValidator validator = validator(
                SAFE_DB_URL,
                SAFE_SECRET,
                SAFE_CORS,
                StorageProperties.StorageType.AZURE_BLOB
        );

        assertThatCode(() -> validator.run(null)).doesNotThrowAnyException();
    }

    @Test
    void rejectsLocalDatasourceEvenWithSslMode() {
        ProdEnvironmentValidator validator = validator(
                "jdbc:postgresql://localhost:5432/fms?sslmode=require",
                SAFE_SECRET,
                SAFE_CORS,
                StorageProperties.StorageType.AZURE_BLOB
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("DB_URL must not point to localhost");
    }

    @Test
    void rejectsPostgresDatasourceWithoutRequiredSslMode() {
        ProdEnvironmentValidator validator = validator(
                "jdbc:postgresql://fms-prod.postgres.database.azure.com:5432/fms",
                SAFE_SECRET,
                SAFE_CORS,
                StorageProperties.StorageType.AZURE_BLOB
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("sslmode=require");
    }

    @Test
    void rejectsUnsafeCorsOrigins() {
        ProdEnvironmentValidator validator = validator(
                SAFE_DB_URL,
                SAFE_SECRET,
                "https://fms.example.com,http://localhost:5173",
                StorageProperties.StorageType.AZURE_BLOB
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("CORS origin must use HTTPS")
                .hasMessageContaining("CORS origin must not point to localhost");
    }

    @Test
    void rejectsLocalStorageType() {
        ProdEnvironmentValidator validator = validator(
                SAFE_DB_URL,
                SAFE_SECRET,
                SAFE_CORS,
                StorageProperties.StorageType.LOCAL
        );

        assertThatThrownBy(() -> validator.run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_STORAGE_TYPE");
    }

    private ProdEnvironmentValidator validator(
            String datasourceUrl,
            String jwtSecret,
            String corsAllowedOrigins,
            StorageProperties.StorageType storageType
    ) {
        StorageProperties storageProperties = new StorageProperties();
        storageProperties.setType(storageType);
        return new ProdEnvironmentValidator(
                datasourceUrl,
                jwtSecret,
                corsAllowedOrigins,
                storageProperties,
                false,
                false
        );
    }
}
