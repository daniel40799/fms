CREATE TABLE events (
                        id UUID PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        description TEXT,
                        venue VARCHAR(255),
                        start_date TIMESTAMP NOT NULL,
                        end_date TIMESTAMP NOT NULL,
                        capacity INTEGER,
                        registration_open TIMESTAMP,
                        registration_close TIMESTAMP,
                        status VARCHAR(50) NOT NULL,
                        organization_id UUID,
                        created_by UUID,
                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

                        CONSTRAINT fk_events_organization
                            FOREIGN KEY (organization_id) REFERENCES organizations(id),

                        CONSTRAINT fk_events_created_by
                            FOREIGN KEY (created_by) REFERENCES users(id)
);
