package com.fapor7.fms.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {

    @Test
    void healthReturnsUpStatus() {
        assertThat(new HealthController().health())
                .containsEntry("status", "UP")
                .containsEntry("service", "fms-api");
    }
}
