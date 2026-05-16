ALTER TABLE registrations
    ADD COLUMN qr_token VARCHAR(255),
    ADD COLUMN qr_generated_at TIMESTAMP;

CREATE UNIQUE INDEX idx_registrations_qr_token
    ON registrations(qr_token);
