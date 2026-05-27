package com.fapor7.fms.organizations;

import com.fapor7.fms.TestData;
import com.fapor7.fms.organizations.dto.OrganizationCreateRequest;
import com.fapor7.fms.organizations.dto.OrganizationResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class OrganizationControllerTest {

    private final OrganizationService organizationService = mock(OrganizationService.class);
    private final OrganizationController controller = new OrganizationController(organizationService);

    @Test
    void findAllDelegatesToService() {
        OrganizationResponse response = response();
        when(organizationService.findAll(false)).thenReturn(List.of(response));

        assertThat(controller.findAll(null)).containsExactly(response);
    }

    @Test
    void createDelegatesToService() {
        OrganizationCreateRequest request = new OrganizationCreateRequest("FAPOR7", "FP7");
        OrganizationResponse response = response();
        when(organizationService.create(request)).thenReturn(response);

        assertThat(controller.create(request)).isSameAs(response);
    }

    @Test
    void deleteDelegatesToService() {
        controller.delete(TestData.uuid(1));

        verify(organizationService).delete(TestData.uuid(1));
    }

    private static OrganizationResponse response() {
        return new OrganizationResponse(TestData.uuid(1), "FAPOR7", "FP7", "ACTIVE");
    }
}
