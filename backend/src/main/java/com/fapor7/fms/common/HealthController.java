package com.fapor7.fms.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Exposes a public health check endpoint for the API service.
 *
 * <p>Monitoring tools, load balancers, and deployment checks can call this
 * endpoint without authentication to verify that the backend is responding.</p>
 */
@RestController
public class HealthController {

    /**
     * Returns a basic health payload.
     *
     * @return status and service identifier
     */
    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of(
                "status", "UP",
                "service", "fms-api"
        );
    }
}
