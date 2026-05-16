CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO organizations (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
)
VALUES (
           '11111111-1111-1111-1111-111111111111',
           'FAPOR7',
           'FAPOR7',
           'ACTIVE',
           NOW(),
           NOW()
       );

INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    status,
    organization_id,
    created_at,
    updated_at
)
VALUES (
           '22222222-2222-2222-2222-222222222222',
           'daniel@fapor7.org',
           '$2a$12$aA9FlcywddR61o4waOTn8ehHchJVsBLcLm3fvmzssk5Mmyo9RFDj2',
           'FAPOR7 Main Administrator',
           'ACTIVE',
           '11111111-1111-1111-1111-111111111111',
           NOW(),
           NOW()
       );

INSERT INTO user_roles (
    user_id,
    role_id
)
SELECT
    '22222222-2222-2222-2222-222222222222',
    r.id
FROM roles r
WHERE r.name = 'MAIN_ADMIN';
