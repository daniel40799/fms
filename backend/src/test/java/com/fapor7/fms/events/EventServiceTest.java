package com.fapor7.fms.events;

import com.fapor7.fms.TestData;
import com.fapor7.fms.events.dto.EventCreateRequest;
import com.fapor7.fms.events.dto.EventResponse;
import com.fapor7.fms.events.dto.EventUpdateRequest;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.organizations.OrganizationRepository;
import com.fapor7.fms.users.UserEntity;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private OrganizationRepository organizationRepository;

    @InjectMocks
    private EventService eventService;

    @Test
    void findAllMapsEvents() {
        OrganizationEntity organization = TestData.organization(1);
        UserEntity creator = TestData.activeUser(2);
        EventEntity event = TestData.event(3, organization, creator);
        when(eventRepository.findAll()).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.findAll();

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().organizationName()).isEqualTo("Organization 1");
        assertThat(responses.getFirst().createdByName()).isEqualTo("User 2");
    }

    @Test
    void findByIdReturnsEvent() {
        EventEntity event = TestData.event(3, null, null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        EventResponse response = eventService.findById(event.getId());

        assertThat(response.id()).isEqualTo(event.getId());
        assertThat(response.organizationName()).isNull();
        assertThat(response.createdByName()).isNull();
    }

    @Test
    void findByIdThrowsWhenMissing() {
        when(eventRepository.findById(TestData.uuid(404))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.findById(TestData.uuid(404)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Event not found");
    }

    @Test
    void createSavesDraftEventWithOrganization() {
        OrganizationEntity organization = TestData.organization(1);
        UserEntity creator = TestData.activeUser(2);
        EventCreateRequest request = createRequest(organization.getId());
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(eventRepository.save(org.mockito.ArgumentMatchers.any(EventEntity.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        EventResponse response = eventService.create(request, TestData.principal(creator));

        assertThat(response.status()).isEqualTo("DRAFT");
        assertThat(response.organizationId()).isEqualTo(organization.getId());
        assertThat(response.createdById()).isEqualTo(creator.getId());
        ArgumentCaptor<EventEntity> captor = ArgumentCaptor.forClass(EventEntity.class);
        verify(eventRepository).save(captor.capture());
        assertThat(captor.getValue().getTitle()).isEqualTo("New Event");
    }

    @Test
    void createThrowsWhenOrganizationIsMissing() {
        EventCreateRequest request = createRequest(TestData.uuid(99));
        when(organizationRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.create(request, TestData.principal(TestData.activeUser(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Organization not found");
    }

    @Test
    void updateReplacesEditableFieldsAndStatus() {
        EventEntity event = TestData.event(1, null, null);
        OrganizationEntity organization = TestData.organization(2);
        EventUpdateRequest request = updateRequest(organization.getId(), "PUBLISHED");
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(organizationRepository.findById(organization.getId())).thenReturn(Optional.of(organization));
        when(eventRepository.save(event)).thenReturn(event);

        EventResponse response = eventService.update(event.getId(), request);

        assertThat(response.title()).isEqualTo("Updated Event");
        assertThat(response.status()).isEqualTo("PUBLISHED");
        assertThat(response.organizationName()).isEqualTo("Organization 2");
    }

    @Test
    void updateKeepsExistingStatusWhenStatusIsNull() {
        EventEntity event = TestData.event(1, null, null);
        event.setStatus(EventStatus.DRAFT);
        EventUpdateRequest request = updateRequest(null, null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);

        EventResponse response = eventService.update(event.getId(), request);

        assertThat(response.status()).isEqualTo("DRAFT");
        assertThat(response.organizationId()).isNull();
    }

    @Test
    void updateRejectsArchivedEvents() {
        EventEntity event = TestData.event(1, null, null);
        event.setStatus(EventStatus.ARCHIVED);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.update(event.getId(), updateRequest(null, null)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Archived events cannot be edited");
    }

    @Test
    void updateRejectsArchiveStatus() {
        EventEntity event = TestData.event(1, null, null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.update(event.getId(), updateRequest(null, "ARCHIVED")))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Use the archive action for published events");
    }

    @Test
    void updateRejectsNegativePrice() {
        EventEntity event = TestData.event(1, null, null);
        EventUpdateRequest request = new EventUpdateRequest(
                "Updated Event",
                "Updated Description",
                "Updated Venue",
                TestData.time(5),
                TestData.time(6),
                30,
                TestData.time(2),
                TestData.time(4),
                BigDecimal.valueOf(-1),
                "wide",
                "portrait",
                null,
                null
        );
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.update(event.getId(), request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Registration price must be zero or greater");
    }

    @Test
    void createRejectsMissingPoster() {
        EventCreateRequest request = new EventCreateRequest(
                "New Event",
                "Description",
                "Venue",
                TestData.time(3),
                TestData.time(4),
                25,
                TestData.time(1),
                TestData.time(2),
                BigDecimal.ZERO,
                " ",
                "portrait",
                null
        );

        assertThatThrownBy(() -> eventService.create(request, TestData.principal(TestData.activeUser(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Horizontal poster is required");
    }

    @Test
    void updateThrowsWhenEventIsMissing() {
        when(eventRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.update(TestData.uuid(99), updateRequest(null, null)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Event not found");
    }

    @Test
    void updateThrowsWhenOrganizationIsMissing() {
        EventEntity event = TestData.event(1, null, null);
        EventUpdateRequest request = updateRequest(TestData.uuid(88), null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(organizationRepository.findById(TestData.uuid(88))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.update(event.getId(), request))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Organization not found");
    }

    @Test
    void archiveMarksEventArchived() {
        EventEntity event = TestData.event(1, null, null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));
        when(eventRepository.save(event)).thenReturn(event);

        EventResponse response = eventService.archive(event.getId());

        assertThat(response.status()).isEqualTo("ARCHIVED");
    }

    @Test
    void archiveThrowsWhenMissing() {
        when(eventRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.archive(TestData.uuid(99)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Event not found");
    }

    @Test
    void archiveRejectsDrafts() {
        EventEntity event = TestData.event(1, null, null);
        event.setStatus(EventStatus.DRAFT);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.archive(event.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Only published events can be archived");
    }

    @Test
    void deleteDraftRemovesDraft() {
        EventEntity event = TestData.event(1, null, null);
        event.setStatus(EventStatus.DRAFT);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        eventService.deleteDraft(event.getId());

        verify(eventRepository).delete(event);
    }

    @Test
    void deleteDraftRejectsPublishedEvent() {
        EventEntity event = TestData.event(1, null, null);
        when(eventRepository.findById(event.getId())).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> eventService.deleteDraft(event.getId()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Only draft events can be deleted");
    }

    @Test
    void deleteDraftRejectsMissingEvent() {
        when(eventRepository.findById(TestData.uuid(99))).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.deleteDraft(TestData.uuid(99)))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Event not found");
    }

    private static EventCreateRequest createRequest(java.util.UUID organizationId) {
        return new EventCreateRequest(
                "New Event",
                "Description",
                "Venue",
                TestData.time(3),
                TestData.time(4),
                25,
                TestData.time(1),
                TestData.time(2),
                BigDecimal.valueOf(250),
                "https://assets.example.test/wide.jpg",
                "https://assets.example.test/portrait.jpg",
                organizationId
        );
    }

    private static EventUpdateRequest updateRequest(java.util.UUID organizationId, String status) {
        return new EventUpdateRequest(
                "Updated Event",
                "Updated Description",
                "Updated Venue",
                TestData.time(5),
                TestData.time(6),
                30,
                TestData.time(2),
                TestData.time(4),
                BigDecimal.valueOf(300),
                "https://assets.example.test/updated-wide.jpg",
                "https://assets.example.test/updated-portrait.jpg",
                organizationId,
                status
        );
    }
}
