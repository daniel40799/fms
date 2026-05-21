package com.fapor7.fms.attendance;

import com.fapor7.fms.attendance.dto.AttendanceCheckInRequest;
import com.fapor7.fms.attendance.dto.AttendanceResponse;
import com.fapor7.fms.auth.AuthenticatedUser;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Exposes QR-based attendance endpoints.
 *
 * <p>Event and main administrators use this controller to scan a participant's
 * registration QR token and to view attendance logs across events.</p>
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * Creates the controller with the attendance service dependency.
     *
     * @param attendanceService service that applies attendance rules
     */
    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * Checks in a participant using a registration QR token.
     *
     * @param request QR token submitted by the scanner
     * @param authenticatedUser administrator performing the scan
     * @return created attendance log
     */
    @PostMapping("/check-in")
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN')")
    public AttendanceResponse checkIn(
            @RequestBody AttendanceCheckInRequest request,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return attendanceService.checkIn(request, authenticatedUser);
    }

    /**
     * Lists all attendance logs for administrative reporting.
     *
     * @return list of all attendance records
     */
    @GetMapping
    @PreAuthorize("hasRole('MAIN_ADMIN') or hasRole('EVENT_ADMIN') or hasRole('USER_ADMIN')")
    public List<AttendanceResponse> findAll() {
        return attendanceService.findAll();
    }
}
