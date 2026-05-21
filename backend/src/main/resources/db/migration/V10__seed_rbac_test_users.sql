WITH seed_users (id, email, full_name, role_name) AS (
    VALUES
        ('33333333-3333-3333-3333-333333333333'::UUID, 'user.admin@fapor7.org', 'FAPOR7 User Administrator', 'USER_ADMIN'),
        ('44444444-4444-4444-4444-444444444444'::UUID, 'event.admin@fapor7.org', 'FAPOR7 Event Administrator', 'EVENT_ADMIN'),
        ('55555555-5555-5555-5555-555555555555'::UUID, 'organization.admin@fapor7.org', 'FAPOR7 Organization Administrator', 'ORGANIZATION_ADMIN'),
        ('66666666-6666-6666-6666-666666666666'::UUID, 'exhibitor@fapor7.org', 'FAPOR7 Exhibitor', 'EXHIBITOR'),
        ('77777777-7777-7777-7777-777777777777'::UUID, 'end.user@fapor7.org', 'FAPOR7 End User', 'END_USER')
),
main_admin AS (
    SELECT password_hash
    FROM users
    WHERE email = 'daniel@fapor7.org'
),
fapor7_organization AS (
    SELECT id
    FROM organizations
    WHERE code = 'FAPOR7'
)
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
SELECT
    seed_users.id,
    seed_users.email,
    main_admin.password_hash,
    seed_users.full_name,
    'ACTIVE',
    fapor7_organization.id,
    NOW(),
    NOW()
FROM seed_users
CROSS JOIN main_admin
CROSS JOIN fapor7_organization
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    status = EXCLUDED.status,
    organization_id = EXCLUDED.organization_id,
    updated_at = NOW();

WITH seed_roles (email, role_name) AS (
    VALUES
        ('user.admin@fapor7.org', 'USER_ADMIN'),
        ('event.admin@fapor7.org', 'EVENT_ADMIN'),
        ('organization.admin@fapor7.org', 'ORGANIZATION_ADMIN'),
        ('exhibitor@fapor7.org', 'EXHIBITOR'),
        ('end.user@fapor7.org', 'END_USER')
)
INSERT INTO user_roles (
    user_id,
    role_id
)
SELECT
    users.id,
    roles.id
FROM seed_roles
JOIN users ON users.email = seed_roles.email
JOIN roles ON roles.name = seed_roles.role_name
ON CONFLICT (user_id, role_id) DO NOTHING;
