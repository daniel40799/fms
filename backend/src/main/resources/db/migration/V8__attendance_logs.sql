CREATE TABLE attendance_logs (
                                 id UUID PRIMARY KEY,
                                 registration_id UUID NOT NULL,
                                 event_id UUID NOT NULL,
                                 user_id UUID NOT NULL,
                                 checked_in_by UUID NOT NULL,
                                 checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),

                                 CONSTRAINT fk_attendance_registration
                                     FOREIGN KEY (registration_id) REFERENCES registrations(id),

                                 CONSTRAINT fk_attendance_event
                                     FOREIGN KEY (event_id) REFERENCES events(id),

                                 CONSTRAINT fk_attendance_user
                                     FOREIGN KEY (user_id) REFERENCES users(id),

                                 CONSTRAINT fk_attendance_checked_in_by
                                     FOREIGN KEY (checked_in_by) REFERENCES users(id),

                                 CONSTRAINT uq_attendance_registration
                                     UNIQUE (registration_id)
);
