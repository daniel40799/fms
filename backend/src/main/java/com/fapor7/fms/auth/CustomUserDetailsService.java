package com.fapor7.fms.auth;

import com.fapor7.fms.users.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Loads FAPOR7 users for Spring Security.
 *
 * <p>Login uses email lookup, while JWT validation uses the UUID stored in the
 * token subject to restore the authenticated principal.</p>
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Loads a user by email during username/password authentication.
     *
     * @param email login email submitted as the username
     * @return Spring Security user details wrapper
     * @throws UsernameNotFoundException when no user exists for the email
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(AuthenticatedUser::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    /**
     * Loads a user by UUID when processing an already-issued JWT.
     *
     * @param userId user id extracted from the token subject
     * @return Spring Security user details wrapper
     * @throws UsernameNotFoundException when no user exists for the id
     */
    public UserDetails loadUserById(UUID userId) {
        return userRepository.findById(userId)
                .map(AuthenticatedUser::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
