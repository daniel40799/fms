package com.fapor7.fms.organizations;

import com.fapor7.fms.TestData;
import com.fapor7.fms.organizations.dto.OrganizationCreateRequest;
import com.fapor7.fms.organizations.dto.OrganizationResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private OrganizationService organizationService;

    @Test
    void findAllMapsOrganizations() {
        when(organizationRepository.findAll()).thenReturn(List.of(TestData.organization(1)));

        List<OrganizationResponse> responses = organizationService.findAll();

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().name()).isEqualTo("Organization 1");
        assertThat(responses.getFirst().code()).isEqualTo("ORG1");
        assertThat(responses.getFirst().status()).isEqualTo("ACTIVE");
    }

    @Test
    void createSavesActiveOrganization() {
        when(organizationRepository.save(any(OrganizationEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        OrganizationResponse response = organizationService.create(new OrganizationCreateRequest("FAPOR7", "FP7"));

        assertThat(response.id()).isNotNull();
        assertThat(response.name()).isEqualTo("FAPOR7");
        assertThat(response.code()).isEqualTo("FP7");
        assertThat(response.status()).isEqualTo("ACTIVE");
    }

    @Test
    void deleteRemovesOrganization() {
        OrganizationEntity organization = TestData.organization(1);
        when(organizationRepository.findById(TestData.uuid(1))).thenReturn(Optional.of(organization));

        organizationService.delete(TestData.uuid(1));

        verify(organizationRepository).delete(organization);
    }

    @Test
    void deleteRejectsMissingOrganization() {
        when(organizationRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> organizationService.delete(TestData.uuid(99)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Organization not found");
    }
}
