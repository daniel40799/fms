package com.fapor7.fms.config;

import com.fapor7.fms.auth.JwtAuthenticationFilter;
import com.fapor7.fms.auth.SsoAuthenticationSuccessHandler;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configures backend API security.
 *
 * <p>The API is stateless, uses JWT bearer authentication, permits login and
 * health checks without a token, and relies on method-level role annotations
 * for module-specific access control.</p>
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final SsoAuthenticationSuccessHandler ssoAuthenticationSuccessHandler;
    private final boolean ssoEnabled;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            SsoAuthenticationSuccessHandler ssoAuthenticationSuccessHandler,
            @Value("${app.sso.enabled:false}") boolean ssoEnabled
    ) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.ssoAuthenticationSuccessHandler = ssoAuthenticationSuccessHandler;
        this.ssoEnabled = ssoEnabled;
    }

    /**
     * Builds the HTTP security filter chain for REST API requests.
     *
     * @param http Spring Security HTTP builder
     * @return configured security filter chain
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .logout(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> {
                    auth.requestMatchers(HttpMethod.GET, "/api/health").permitAll();
                    auth.requestMatchers(HttpMethod.GET, "/api/organizations").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll();
                    auth.requestMatchers(HttpMethod.POST, "/api/auth/register").permitAll();

                    if (ssoEnabled) {
                        auth.requestMatchers("/oauth2/**", "/login/oauth2/**").permitAll();
                    }

                    auth.anyRequest().authenticated();
                });

        if (ssoEnabled) {
            http
                    .sessionManagement(session ->
                            session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                    )
                    .oauth2Login(oauth -> oauth
                            .successHandler(ssoAuthenticationSuccessHandler)
                    );
        } else {
            http.sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            );
        }

        return http
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

}
