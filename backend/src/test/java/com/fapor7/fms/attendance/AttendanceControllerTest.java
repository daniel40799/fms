package com.fapor7.fms.attendance;

import com.fapor7.fms.TestData;
import com.fapor7.fms.attendance.dto.AttendanceCheckInRequest;
import com.fapor7.fms.attendance.dto.AttendanceResponse;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AttendanceControllerTest {

    private final AttendanceService attendanceService = mock(AttendanceService.class);
    private final AttendanceController controller = new AttendanceController(attendanceService);

    @Test
    void checkInDelegatesToService() {
        AttendanceCheckInRequest request = new AttendanceCheckInRequest("qr");
        AttendanceResponse response = response();
        var principal = TestData.principal(TestData.activeUser(1));
        when(attendanceService.checkIn(request, principal)).thenReturn(response);

        assertThat(controller.checkIn(request, principal)).isSameAs(response);
    }

    @Test
    void findAllDelegatesToService() {
        AttendanceResponse response = response();
        when(attendanceService.findAll()).thenReturn(List.of(response));

        assertThat(controller.findAll()).containsExactly(response);
    }

    private static AttendanceResponse response() {
        return new AttendanceResponse(TestData.uuid(1), TestData.uuid(2), TestData.uuid(3), "Event", TestData.uuid(4), "User", TestData.uuid(5), "Scanner", TestData.time(1));
    }
}
