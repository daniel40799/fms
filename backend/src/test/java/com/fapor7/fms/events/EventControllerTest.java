package com.fapor7.fms.events;

import com.fapor7.fms.TestData;
import com.fapor7.fms.events.dto.EventCreateRequest;
import com.fapor7.fms.events.dto.EventResponse;
import com.fapor7.fms.events.dto.EventUpdateRequest;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class EventControllerTest {

    private final EventService eventService = mock(EventService.class);
    private final EventController controller = new EventController(eventService);

    @Test
    void findAllDelegatesToService() {
        EventResponse response = response();
        when(eventService.findAll()).thenReturn(List.of(response));

        assertThat(controller.findAll()).containsExactly(response);
    }

    @Test
    void findByIdDelegatesToService() {
        EventResponse response = response();
        when(eventService.findById(TestData.uuid(1))).thenReturn(response);

        assertThat(controller.findById(TestData.uuid(1))).isSameAs(response);
    }

    @Test
    void createDelegatesToService() {
        EventCreateRequest request = new EventCreateRequest("t", "d", "v", null, null, null, null, null, BigDecimal.ZERO, "wide", "vertical", null);
        EventResponse response = response();
        var principal = TestData.principal(TestData.activeUser(1));
        when(eventService.create(request, principal)).thenReturn(response);

        assertThat(controller.create(request, principal)).isSameAs(response);
    }

    @Test
    void updateDelegatesToService() {
        EventUpdateRequest request = new EventUpdateRequest("t", "d", "v", null, null, null, null, null, BigDecimal.ZERO, "wide", "vertical", null, null);
        EventResponse response = response();
        when(eventService.update(TestData.uuid(1), request)).thenReturn(response);

        assertThat(controller.update(TestData.uuid(1), request)).isSameAs(response);
    }

    @Test
    void archiveDelegatesToService() {
        EventResponse response = response();
        when(eventService.archive(TestData.uuid(1))).thenReturn(response);

        assertThat(controller.archive(TestData.uuid(1))).isSameAs(response);
        verify(eventService).archive(TestData.uuid(1));
    }

    @Test
    void deleteDraftDelegatesToService() {
        controller.deleteDraft(TestData.uuid(1));

        verify(eventService).deleteDraft(TestData.uuid(1));
    }

    private static EventResponse response() {
        return new EventResponse(TestData.uuid(1), "t", "d", "v", null, null, null, null, null, BigDecimal.ZERO, "wide", "vertical", "DRAFT", null, null, null, null);
    }
}
