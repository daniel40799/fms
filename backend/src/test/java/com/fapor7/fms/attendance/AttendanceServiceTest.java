package com.fapor7.fms.attendance;

import com.fapor7.fms.TestData;
import com.fapor7.fms.attendance.dto.AttendanceCheckInRequest;
import com.fapor7.fms.attendance.dto.AttendanceResponse;
import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.registrations.RegistrationEntity;
import com.fapor7.fms.registrations.RegistrationRepository;
import com.fapor7.fms.registrations.RegistrationStatus;
import com.fapor7.fms.users.UserEntity;
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
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private RegistrationRepository registrationRepository;

    @InjectMocks
    private AttendanceService attendanceService;

    @Test
    void checkInCreatesAttendanceForConfirmedRegistration() {
        UserEntity participant = TestData.activeUser(1);
        UserEntity scanner = TestData.activeUser(2);
        EventEntity event = TestData.event(3, null, scanner);
        RegistrationEntity registration = TestData.registration(4, event, participant, RegistrationStatus.CONFIRMED);
        registration.setQrToken("qr-token");
        when(registrationRepository.findByQrToken("qr-token")).thenReturn(Optional.of(registration));
        when(attendanceRepository.findByRegistrationId(registration.getId())).thenReturn(Optional.empty());
        when(attendanceRepository.save(any(AttendanceEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AttendanceResponse response = attendanceService.checkIn(new AttendanceCheckInRequest("qr-token"), TestData.principal(scanner));

        assertThat(response.registrationId()).isEqualTo(registration.getId());
        assertThat(response.eventTitle()).isEqualTo(event.getTitle());
        assertThat(response.userFullName()).isEqualTo(participant.getFullName());
        assertThat(response.checkedInByName()).isEqualTo(scanner.getFullName());
    }

    @Test
    void checkInRejectsInvalidQrToken() {
        when(registrationRepository.findByQrToken("bad")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.checkIn(new AttendanceCheckInRequest("bad"), TestData.principal(TestData.activeUser(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Invalid QR token");
    }

    @Test
    void checkInRejectsUnconfirmedRegistration() {
        RegistrationEntity registration = TestData.registration(
                1,
                TestData.event(2, null, null),
                TestData.activeUser(3),
                RegistrationStatus.PENDING_PAYMENT
        );
        when(registrationRepository.findByQrToken("qr")).thenReturn(Optional.of(registration));

        assertThatThrownBy(() -> attendanceService.checkIn(new AttendanceCheckInRequest("qr"), TestData.principal(TestData.activeUser(4))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Registration is not confirmed");
    }

    @Test
    void checkInRejectsDuplicateAttendance() {
        RegistrationEntity registration = TestData.registration(
                1,
                TestData.event(2, null, null),
                TestData.activeUser(3),
                RegistrationStatus.CONFIRMED
        );
        when(registrationRepository.findByQrToken("qr")).thenReturn(Optional.of(registration));
        when(attendanceRepository.findByRegistrationId(registration.getId()))
                .thenReturn(Optional.of(TestData.attendance(5, registration, TestData.activeUser(4))));

        assertThatThrownBy(() -> attendanceService.checkIn(new AttendanceCheckInRequest("qr"), TestData.principal(TestData.activeUser(4))))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Participant already checked in");
    }

    @Test
    void findAllMapsAttendanceLogs() {
        UserEntity scanner = TestData.activeUser(4);
        RegistrationEntity registration = TestData.registration(
                1,
                TestData.event(2, null, null),
                TestData.activeUser(3),
                RegistrationStatus.CONFIRMED
        );
        AttendanceEntity attendance = TestData.attendance(5, registration, scanner);
        when(attendanceRepository.findAll()).thenReturn(List.of(attendance));

        List<AttendanceResponse> responses = attendanceService.findAll();

        assertThat(responses).hasSize(1);
        assertThat(responses.getFirst().checkedInById()).isEqualTo(scanner.getId());
    }
}
