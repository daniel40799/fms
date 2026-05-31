package com.fapor7.fms.registrations;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Upload validation settings for participant payment proofs.
 */
@Component
@ConfigurationProperties(prefix = "app.payment-proof")
public class PaymentProofProperties {

    private long maxSizeBytes = 10 * 1024 * 1024;
    private Set<String> allowedContentTypes = Set.of("image/jpeg", "image/png", "application/pdf");
    private Set<String> allowedExtensions = Set.of("jpg", "jpeg", "png", "pdf");

    public long getMaxSizeBytes() {
        return maxSizeBytes;
    }

    public void setMaxSizeBytes(long maxSizeBytes) {
        this.maxSizeBytes = maxSizeBytes;
    }

    public Set<String> getAllowedContentTypes() {
        return allowedContentTypes;
    }

    public void setAllowedContentTypes(Set<String> allowedContentTypes) {
        this.allowedContentTypes = normalize(allowedContentTypes);
    }

    public Set<String> getAllowedExtensions() {
        return allowedExtensions;
    }

    public void setAllowedExtensions(Set<String> allowedExtensions) {
        this.allowedExtensions = normalizeExtensions(allowedExtensions);
    }

    private Set<String> normalize(Set<String> values) {
        if (values == null || values.isEmpty()) {
            return new LinkedHashSet<>();
        }

        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    private Set<String> normalizeExtensions(Set<String> values) {
        return normalize(values).stream()
                .map(value -> value.startsWith(".") ? value.substring(1) : value)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
