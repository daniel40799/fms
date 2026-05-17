package com.fapor7.fms.auth;

import com.fapor7.fms.TestData;
import com.fapor7.fms.roles.RoleName;
import com.fapor7.fms.users.UserEntity;
import com.fapor7.fms.users.UserStatus;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthenticatedUserTest {

    @Test
    void exposesWrappedUserCredentialsAndAuthorities() {
        UserEntity user = TestData.user(
                1,
                "admin@example.test",
                "Admin",
                UserStatus.ACTIVE,
                RoleName.MAIN_ADMIN,
                RoleName.EVENT_ADMIN
        );

        AuthenticatedUser authenticatedUser = new AuthenticatedUser(user);

        assertThat(authenticatedUser.getUser()).isSameAs(user);
        assertThat(authenticatedUser.getUsername()).isEqualTo("admin@example.test");
        assertThat(authenticatedUser.getPassword()).isEqualTo("hash-1");
        assertThat(authenticatedUser.getAuthorities())
                .extracting("authority")
                .containsExactlyInAnyOrder("ROLE_MAIN_ADMIN", "ROLE_EVENT_ADMIN");
    }
}
