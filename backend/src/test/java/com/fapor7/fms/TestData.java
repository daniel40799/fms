package com.fapor7.fms;

import com.fapor7.fms.auth.AuthenticatedUser;
import com.fapor7.fms.attendance.AttendanceEntity;
import com.fapor7.fms.events.EventEntity;
import com.fapor7.fms.events.EventStatus;
import com.fapor7.fms.organizations.OrganizationEntity;
import com.fapor7.fms.registrations.RegistrationEntity;
import com.fapor7.fms.registrations.RegistrationStatus;
import com.fapor7.fms.roles.RoleEntity;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserStatus;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public final class TestData {

    private TestData() {
    }

    public static UUID uuid(int value) {
        return UUID.fromString(String.format("00000000-0000-0000-0000-%012d", value));
    }

    public static LocalDateTime time(int day) {
        return LocalDateTime.of(2026, 1, day, 9, 30);
    }

    public static RoleEntity role(RoleName name) {
        RoleEntity role = new RoleEntity();
        role.setId(uuid(name.ordinal() + 100));
        role.setName(name);
        role.setDescription(name.name());
        return role;
    }

    public static OrganizationEntity organization(int id) {
        OrganizationEntity organization = new OrganizationEntity();
        organization.setId(uuid(id));
        organization.setName("Organization " + id);
        organization.setCode("ORG" + id);
        organization.setStatus("ACTIVE");
        organization.setCreatedAt(time(1));
        organization.setUpdatedAt(time(2));
        return organization;
    }

    public static UserEntity user(int id, String email, String fullName, UserStatus status, RoleName... roles) {
        UserEntity user = new UserEntity();
        user.setId(uuid(id));
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPasswordHash("hash-" + id);
        user.setStatus(status);
        user.setRoles(Arrays.stream(roles).map(TestData::role).collect(Collectors.toSet()));
        user.setCreatedAt(time(1));
        user.setUpdatedAt(time(2));
        return user;
    }

    public static UserEntity activeUser(int id) {
        return user(id, "user" + id + "@example.test", "User " + id, UserStatus.ACTIVE, RoleName.END_USER);
    }

    public static AuthenticatedUser principal(UserEntity user) {
        return new AuthenticatedUser(user);
    }

    public static EventEntity event(int id, OrganizationEntity organization, UserEntity creator) {
        EventEntity event = new EventEntity();
        event.setId(uuid(id));
        event.setTitle("Event " + id);
        event.setDescription("Description " + id);
        event.setVenue("Venue " + id);
        event.setStartDate(time(3));
        event.setEndDate(time(4));
        event.setCapacity(100);
        event.setRegistrationOpen(time(1));
        event.setRegistrationClose(time(2));
        event.setStatus(EventStatus.PUBLISHED);
        event.setOrganization(organization);
        event.setCreatedBy(creator);
        event.setCreatedAt(time(1));
        event.setUpdatedAt(time(2));
        return event;
    }

    public static RegistrationEntity registration(
            int id,
            EventEntity event,
            UserEntity user,
            RegistrationStatus status
    ) {
        RegistrationEntity registration = new RegistrationEntity();
        registration.setId(uuid(id));
        registration.setEvent(event);
        registration.setUser(user);
        registration.setStatus(status);
        registration.setRegisteredAt(time(5));
        registration.setUpdatedAt(time(6));
        return registration;
    }

    public static AttendanceEntity attendance(int id, RegistrationEntity registration, UserEntity scanner) {
        AttendanceEntity attendance = new AttendanceEntity();
        attendance.setId(uuid(id));
        attendance.setRegistration(registration);
        attendance.setEvent(registration.getEvent());
        attendance.setUser(registration.getUser());
        attendance.setCheckedInBy(scanner);
        attendance.setCheckedInAt(time(7));
        return attendance;
    }

    public static Set<RoleName> roles(RoleName... roles) {
        return Set.of(roles);
    }
}
