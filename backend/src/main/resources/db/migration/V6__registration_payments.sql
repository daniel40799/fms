ALTER TABLE registrations
    ADD COLUMN payment_reference VARCHAR(255),
    ADD COLUMN payment_file_path VARCHAR(1000),
    ADD COLUMN payment_uploaded_at TIMESTAMP,
    ADD COLUMN approved_by UUID,
    ADD COLUMN approved_at TIMESTAMP,
    ADD COLUMN remarks TEXT;

ALTER TABLE registrations
    ADD CONSTRAINT fk_registrations_approved_by
        FOREIGN KEY (approved_by) REFERENCES users(id);
