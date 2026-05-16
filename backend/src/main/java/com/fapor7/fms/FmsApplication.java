package com.fapor7.fms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Starts the FAPOR7 event management backend.
 *
 * <p>The backend exposes REST APIs for authentication, user and organization
 * administration, event setup, participant registration, payment proof review,
 * QR-based attendance, and related administrative workflows.</p>
 */
@SpringBootApplication
public class FmsApplication {

	/**
	 * Boots the Spring application context and embedded web server.
	 *
	 * @param args command-line arguments passed by the runtime
	 */
	public static void main(String[] args) {
		SpringApplication.run(FmsApplication.class, args);
	}

}
