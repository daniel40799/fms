CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE roles (
                       id UUID PRIMARY KEY,
                       name VARCHAR(100) NOT NULL UNIQUE,
                       description VARCHAR(255)
);

CREATE TABLE organizations (
                               id UUID PRIMARY KEY,
                               name VARCHAR(255) NOT NULL,
                               code VARCHAR(100) UNIQUE,
                               status VARCHAR(50) NOT NULL,
                               created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                               updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

ALTER TABLE users
    ADD COLUMN organization_id UUID;

ALTER TABLE users
    ADD CONSTRAINT fk_users_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id);

CREATE TABLE user_roles (
                            user_id UUID NOT NULL,
                            role_id UUID NOT NULL,
                            PRIMARY KEY (user_id, role_id),
                            CONSTRAINT fk_user_roles_user
                                FOREIGN KEY (user_id) REFERENCES users(id),
                            CONSTRAINT fk_user_roles_role
                                FOREIGN KEY (role_id) REFERENCES roles(id)
);

INSERT INTO roles (id, name, description) VALUES
                                              (gen_random_uuid(), 'MAIN_ADMIN', 'Maintains the entire site'),
                                              (gen_random_uuid(), 'USER_ADMIN', 'Maintains user information and profile fields'),
                                              (gen_random_uuid(), 'EVENT_ADMIN', 'Maintains events'),
                                              (gen_random_uuid(), 'ORGANIZATION_ADMIN', 'Maintains organization user affiliations'),
                                              (gen_random_uuid(), 'EXHIBITOR', 'Scans participant QR codes for engagement'),
                                              (gen_random_uuid(), 'END_USER', 'Updates profile and registers to events');
