CREATE TABLE registrations (
                               id UUID PRIMARY KEY,
                               event_id UUID NOT NULL,
                               user_id UUID NOT NULL,
                               status VARCHAR(50) NOT NULL,
                               registered_at TIMESTAMP NOT NULL DEFAULT NOW(),
                               updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

                               CONSTRAINT fk_registrations_event
                                   FOREIGN KEY (event_id) REFERENCES events(id),

                               CONSTRAINT fk_registrations_user
                                   FOREIGN KEY (user_id) REFERENCES users(id),

                               CONSTRAINT uq_registration_event_user
                                   UNIQUE (event_id, user_id)
);
