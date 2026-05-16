package com.fapor7.fms.auth;

import com.fapor7.fms.roles.RoleEntity;
import com.fapor7.fms.users.UserEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;

/**
 * Adapts a FAPOR7 {@link UserEntity} to Spring Security's {@link UserDetails}.
 *
 * <p>The security layer uses this principal to expose the authenticated user,
 * password hash, email username, and role authorities derived from the user's
 * assigned FAPOR7 roles.</p>
 */
public class AuthenticatedUser implements UserDetails {

    private final UserEntity user;

    public AuthenticatedUser(UserEntity user) {
        this.user = user;
    }

    /**
     * Returns the domain user attached to the current security principal.
     *
     * @return authenticated application user
     */
    public UserEntity getUser() {
        return user;
    }

    /**
     * Converts assigned roles to Spring Security authorities.
     *
     * @return authorities in the {@code ROLE_<ROLE_NAME>} format
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return user.getRoles()
                .stream()
                .map(RoleEntity::getName)
                .map(roleName -> new SimpleGrantedAuthority("ROLE_" + roleName.name()))
                .toList();
    }

    /**
     * Supplies the stored password hash for credential checks.
     *
     * @return encoded password hash from the user record
     */
    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    /**
     * Uses email as the login username.
     *
     * @return user's email address
     */
    @Override
    public String getUsername() {
        return user.getEmail();
    }
}
