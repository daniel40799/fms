ALTER TABLE events
    ADD COLUMN registration_price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN horizontal_poster_url VARCHAR(1000),
    ADD COLUMN vertical_poster_url VARCHAR(1000);

ALTER TABLE users
    ADD COLUMN first_name VARCHAR(255),
    ADD COLUMN middle_name VARCHAR(255),
    ADD COLUMN last_name VARCHAR(255),
    ADD COLUMN birthday DATE,
    ADD COLUMN sex VARCHAR(50),
    ADD COLUMN address TEXT,
    ADD COLUMN mobile_number VARCHAR(50),
    ADD COLUMN prc_number VARCHAR(7);
