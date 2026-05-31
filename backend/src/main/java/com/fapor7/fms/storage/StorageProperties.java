package com.fapor7.fms.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Upload storage settings sourced from environment variables or profile YAML.
 */
@Component
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    private StorageType type = StorageType.LOCAL;
    private final Local local = new Local();
    private final Azure azure = new Azure();

    public StorageType getType() {
        return type;
    }

    public void setType(StorageType type) {
        this.type = type;
    }

    public Local getLocal() {
        return local;
    }

    public Azure getAzure() {
        return azure;
    }

    public String azureContainerName(StorageContainer container) {
        return switch (container) {
            case PAYMENT_PROOFS -> azure.containers.paymentProofs;
            case PROFILE_PICTURES -> azure.containers.profilePictures;
            case EVENT_RESOURCES -> azure.containers.eventResources;
            case CERTIFICATES -> azure.containers.certificates;
        };
    }

    public boolean hasAzureCredentials() {
        return hasText(azure.connectionString) || (hasText(azure.accountName) && hasText(azure.accountKey));
    }

    public enum StorageType {
        LOCAL,
        AZURE_BLOB
    }

    public static class Local {
        private String basePath = "uploads";

        public String getBasePath() {
            return basePath;
        }

        public void setBasePath(String basePath) {
            this.basePath = basePath;
        }
    }

    public static class Azure {
        private String connectionString;
        private String accountName;
        private String accountKey;
        private final Containers containers = new Containers();

        public String getConnectionString() {
            return connectionString;
        }

        public void setConnectionString(String connectionString) {
            this.connectionString = connectionString;
        }

        public String getAccountName() {
            return accountName;
        }

        public void setAccountName(String accountName) {
            this.accountName = accountName;
        }

        public String getAccountKey() {
            return accountKey;
        }

        public void setAccountKey(String accountKey) {
            this.accountKey = accountKey;
        }

        public Containers getContainers() {
            return containers;
        }
    }

    public static class Containers {
        private String paymentProofs;
        private String profilePictures;
        private String eventResources;
        private String certificates;

        public String getPaymentProofs() {
            return paymentProofs;
        }

        public void setPaymentProofs(String paymentProofs) {
            this.paymentProofs = paymentProofs;
        }

        public String getProfilePictures() {
            return profilePictures;
        }

        public void setProfilePictures(String profilePictures) {
            this.profilePictures = profilePictures;
        }

        public String getEventResources() {
            return eventResources;
        }

        public void setEventResources(String eventResources) {
            this.eventResources = eventResources;
        }

        public String getCertificates() {
            return certificates;
        }

        public void setCertificates(String certificates) {
            this.certificates = certificates;
        }
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
