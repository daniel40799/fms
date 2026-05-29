-- Forward-only cleanup for unsafe rows introduced by V3, V10, and V12.
--
-- Safety rules:
-- - Match only exact seed UUIDs and fixed seed attributes from the old migrations.
-- - Do not match users by email alone, do not use LIKE, and do not delete all rows
--   under DEMO-* organizations.
-- - If a seeded admin/user was changed from the known unsafe seed state, leave it
--   in place so a real production account is not destroyed.
-- - Delete exact child seed records first. Parent rows are deleted only when no
--   remaining child rows reference them.
-- - The real FAPOR7 organization is intentionally not targeted.

CREATE TEMP TABLE v15_seed_admin_users ON COMMIT DROP AS
SELECT *
FROM (
    VALUES
        ('22222222-2222-2222-2222-222222222222'::UUID, 'daniel@fapor7.org', 'FAPOR7 Main Administrator', 'MAIN_ADMIN'),
        ('33333333-3333-3333-3333-333333333333'::UUID, 'user.admin@fapor7.org', 'FAPOR7 User Administrator', 'USER_ADMIN'),
        ('44444444-4444-4444-4444-444444444444'::UUID, 'event.admin@fapor7.org', 'FAPOR7 Event Administrator', 'EVENT_ADMIN'),
        ('55555555-5555-5555-5555-555555555555'::UUID, 'organization.admin@fapor7.org', 'FAPOR7 Organization Administrator', 'ORGANIZATION_ADMIN'),
        ('66666666-6666-6666-6666-666666666666'::UUID, 'exhibitor@fapor7.org', 'FAPOR7 Exhibitor', 'EXHIBITOR'),
        ('77777777-7777-7777-7777-777777777777'::UUID, 'end.user@fapor7.org', 'FAPOR7 End User', 'END_USER')
) AS seed(id, email, full_name, role_name);

CREATE TEMP TABLE v15_seed_member_users ON COMMIT DROP AS
SELECT
    format('88000000-0000-0000-0000-%s', lpad(seed_number::TEXT, 12, '0'))::UUID AS id,
    format('member.user%s@example.test', lpad(seed_number::TEXT, 2, '0')) AS email,
    format('Demo Participant %s', lpad(seed_number::TEXT, 2, '0')) AS full_name,
    'Demo' AS first_name,
    CASE WHEN seed_number % 3 = 0 THEN 'Sample' ELSE NULL END AS middle_name,
    format('Participant %s', lpad(seed_number::TEXT, 2, '0')) AS last_name,
    DATE '1988-01-01' + seed_number AS birthday,
    CASE WHEN seed_number % 2 = 0 THEN 'Female' ELSE 'Male' END AS sex,
    format('Unit %s, Cebu Demo District', seed_number) AS address,
    format('+63917100%s', lpad(seed_number::TEXT, 3, '0')) AS mobile_number,
    lpad((3000000 + seed_number)::TEXT, 7, '0') AS prc_number,
    format('77000000-0000-0000-0000-%s', lpad(((((seed_number - 1) % 12) + 1)::TEXT), 12, '0'))::UUID AS organization_id
FROM generate_series(1, 24) AS series(seed_number);

CREATE TEMP TABLE v15_seed_organizations ON COMMIT DROP AS
SELECT *
FROM (
    VALUES
        ('77000000-0000-0000-0000-000000000001'::UUID, 'Cebu Allied Professionals Council', 'DEMO-01'),
        ('77000000-0000-0000-0000-000000000002'::UUID, 'Central Visayas Engineers Guild', 'DEMO-02'),
        ('77000000-0000-0000-0000-000000000003'::UUID, 'Regional Health Practice Network', 'DEMO-03'),
        ('77000000-0000-0000-0000-000000000004'::UUID, 'Visayas Built Environment Forum', 'DEMO-04'),
        ('77000000-0000-0000-0000-000000000005'::UUID, 'Cebu Finance Leaders Association', 'DEMO-05'),
        ('77000000-0000-0000-0000-000000000006'::UUID, 'Region Seven Legal Circle', 'DEMO-06'),
        ('77000000-0000-0000-0000-000000000007'::UUID, 'Professional Educators Exchange', 'DEMO-07'),
        ('77000000-0000-0000-0000-000000000008'::UUID, 'Digital Practice Consortium', 'DEMO-08'),
        ('77000000-0000-0000-0000-000000000009'::UUID, 'Environmental Stewards Chapter', 'DEMO-09'),
        ('77000000-0000-0000-0000-000000000010'::UUID, 'Hospitality Standards Council', 'DEMO-10'),
        ('77000000-0000-0000-0000-000000000011'::UUID, 'Maritime Competence Alliance', 'DEMO-11'),
        ('77000000-0000-0000-0000-000000000012'::UUID, 'Creative Industry Professionals Hub', 'DEMO-12')
) AS seed(id, name, code);

CREATE TEMP TABLE v15_seed_events ON COMMIT DROP AS
SELECT *
FROM (
    VALUES
        ('99000000-0000-0000-0000-000000000001'::UUID, 'Region Seven Professional Convention', 'PUBLISHED', '77000000-0000-0000-0000-000000000001'::UUID),
        ('99000000-0000-0000-0000-000000000002'::UUID, 'Practice Innovation Expo', 'PUBLISHED', '77000000-0000-0000-0000-000000000008'::UUID),
        ('99000000-0000-0000-0000-000000000003'::UUID, 'Continuing Competence Summit', 'PUBLISHED', '77000000-0000-0000-0000-000000000007'::UUID),
        ('99000000-0000-0000-0000-000000000004'::UUID, 'Built Environment Safety Forum', 'PUBLISHED', '77000000-0000-0000-0000-000000000004'::UUID),
        ('99000000-0000-0000-0000-000000000005'::UUID, 'Health Practice Quality Congress', 'PUBLISHED', '77000000-0000-0000-0000-000000000003'::UUID),
        ('99000000-0000-0000-0000-000000000006'::UUID, 'Finance Governance Roundtable', 'PUBLISHED', '77000000-0000-0000-0000-000000000005'::UUID),
        ('99000000-0000-0000-0000-000000000007'::UUID, 'Professional Ethics Assembly', 'PUBLISHED', '77000000-0000-0000-0000-000000000006'::UUID),
        ('99000000-0000-0000-0000-000000000008'::UUID, 'Green Practice Expo', 'PUBLISHED', '77000000-0000-0000-0000-000000000009'::UUID),
        ('99000000-0000-0000-0000-000000000009'::UUID, 'Hospitality Standards Workshop', 'PUBLISHED', '77000000-0000-0000-0000-000000000010'::UUID),
        ('99000000-0000-0000-0000-000000000010'::UUID, 'Maritime Competence Day', 'PUBLISHED', '77000000-0000-0000-0000-000000000011'::UUID),
        ('99000000-0000-0000-0000-000000000011'::UUID, 'Creative Practice Exchange', 'PUBLISHED', '77000000-0000-0000-0000-000000000012'::UUID),
        ('99000000-0000-0000-0000-000000000012'::UUID, 'Engineering Field Leadership Forum', 'PUBLISHED', '77000000-0000-0000-0000-000000000002'::UUID),
        ('99000000-0000-0000-0000-000000000013'::UUID, 'Draft Sponsor Briefing', 'DRAFT', '77000000-0000-0000-0000-000000000001'::UUID),
        ('99000000-0000-0000-0000-000000000014'::UUID, 'Archived Pilot Attendance Day', 'ARCHIVED', '77000000-0000-0000-0000-000000000008'::UUID)
) AS seed(id, title, status, organization_id);

CREATE TEMP TABLE v15_seed_registrations ON COMMIT DROP AS
SELECT
    format('aa000000-0000-0000-0000-%s', lpad(seed_number::TEXT, 12, '0'))::UUID AS id,
    format('99000000-0000-0000-0000-%s', lpad(((((seed_number - 1) % 12) + 1)::TEXT), 12, '0'))::UUID AS event_id,
    format('88000000-0000-0000-0000-%s', lpad(seed_number::TEXT, 12, '0'))::UUID AS user_id,
    CASE
        WHEN seed_number <= 12 THEN 'CONFIRMED'
        WHEN seed_number <= 18 THEN 'PAYMENT_UPLOADED'
        WHEN seed_number <= 22 THEN 'PENDING_PAYMENT'
        ELSE 'CANCELLED'
    END AS status,
    TIMESTAMP '2026-05-24 09:00:00' + make_interval(days => seed_number) AS registered_at,
    TIMESTAMP '2026-05-24 09:30:00' + make_interval(days => seed_number) AS updated_at,
    CASE
        WHEN seed_number <= 18 THEN format('DEMO-PAY-%s', lpad(seed_number::TEXT, 4, '0'))
        ELSE NULL
    END AS payment_reference,
    CASE
        WHEN seed_number <= 12 THEN '44444444-4444-4444-4444-444444444444'::UUID
        ELSE NULL
    END AS approved_by,
    CASE
        WHEN seed_number <= 12 THEN format('demo-qr-%s', lpad(seed_number::TEXT, 4, '0'))
        ELSE NULL
    END AS qr_token
FROM generate_series(1, 24) AS series(seed_number);

CREATE TEMP TABLE v15_seed_attendance ON COMMIT DROP AS
SELECT
    format('bb000000-0000-0000-0000-%s', lpad(seed_number::TEXT, 12, '0'))::UUID AS id,
    format('aa000000-0000-0000-0000-%s', lpad(seed_number::TEXT, 12, '0'))::UUID AS registration_id,
    format('99000000-0000-0000-0000-%s', lpad(((((seed_number - 1) % 12) + 1)::TEXT), 12, '0'))::UUID AS event_id,
    format('88000000-0000-0000-0000-%s', lpad(seed_number::TEXT, 12, '0'))::UUID AS user_id,
    '44444444-4444-4444-4444-444444444444'::UUID AS checked_in_by,
    TIMESTAMP '2026-06-06 07:45:00' + make_interval(mins => seed_number * 4) AS checked_in_at
FROM generate_series(1, 12) AS series(seed_number);

-- V3/V10 users are removable only while they still have the exact known unsafe
-- BCrypt hash and seed identity. Changed passwords or profile details are
-- treated as evidence that the account may be real production data.
CREATE TEMP TABLE v15_target_users ON COMMIT DROP AS
SELECT users.id
FROM users
JOIN v15_seed_admin_users seed ON seed.id = users.id
JOIN user_roles ON user_roles.user_id = users.id
JOIN roles ON roles.id = user_roles.role_id AND roles.name = seed.role_name
WHERE users.email = seed.email
  AND users.full_name = seed.full_name
  AND users.status = 'ACTIVE'
  AND users.organization_id = '11111111-1111-1111-1111-111111111111'::UUID
  AND users.password_hash = '$2a$12$aA9FlcywddR61o4waOTn8ehHchJVsBLcLm3fvmzssk5Mmyo9RFDj2'
UNION
-- V12 participant users used exact IDs, example.test emails, fixed profile
-- values, and fixed timestamps. The local/dev seeder uses different timestamps,
-- so it is not targeted by this migration.
SELECT users.id
FROM users
JOIN v15_seed_member_users seed ON seed.id = users.id
WHERE users.email = seed.email
  AND users.full_name = seed.full_name
  AND users.first_name = seed.first_name
  AND users.middle_name IS NOT DISTINCT FROM seed.middle_name
  AND users.last_name = seed.last_name
  AND users.birthday = seed.birthday
  AND users.sex = seed.sex
  AND users.address = seed.address
  AND users.mobile_number = seed.mobile_number
  AND users.prc_number = seed.prc_number
  AND users.status = 'ACTIVE'
  AND users.organization_id = seed.organization_id
  AND users.created_at = TIMESTAMP '2026-05-01 09:00:00'
  AND users.updated_at = TIMESTAMP '2026-05-01 09:00:00';

CREATE TEMP TABLE v15_target_organizations ON COMMIT DROP AS
SELECT organizations.id
FROM organizations
JOIN v15_seed_organizations seed ON seed.id = organizations.id
WHERE organizations.name = seed.name
  AND organizations.code = seed.code
  AND organizations.status = 'ACTIVE'
  AND organizations.created_at = TIMESTAMP '2026-05-01 08:00:00'
  AND organizations.updated_at = TIMESTAMP '2026-05-01 08:00:00';

CREATE TEMP TABLE v15_target_events ON COMMIT DROP AS
SELECT events.id
FROM events
JOIN v15_seed_events seed ON seed.id = events.id
WHERE events.title = seed.title
  AND events.status = seed.status
  AND events.organization_id = seed.organization_id
  AND events.created_by = '44444444-4444-4444-4444-444444444444'::UUID
  AND events.created_at = TIMESTAMP '2026-05-01 10:00:00'
  AND events.updated_at = TIMESTAMP '2026-05-01 10:00:00';

CREATE TEMP TABLE v15_target_registrations ON COMMIT DROP AS
SELECT registrations.id
FROM registrations
JOIN v15_seed_registrations seed ON seed.id = registrations.id
WHERE registrations.event_id = seed.event_id
  AND registrations.user_id = seed.user_id
  AND registrations.status = seed.status
  AND registrations.registered_at = seed.registered_at
  AND registrations.updated_at = seed.updated_at
  AND registrations.payment_reference IS NOT DISTINCT FROM seed.payment_reference
  AND registrations.payment_file_path IS NULL
  AND registrations.approved_by IS NOT DISTINCT FROM seed.approved_by
  AND registrations.qr_token IS NOT DISTINCT FROM seed.qr_token;

CREATE TEMP TABLE v15_target_attendance ON COMMIT DROP AS
SELECT attendance_logs.id
FROM attendance_logs
JOIN v15_seed_attendance seed ON seed.id = attendance_logs.id
WHERE attendance_logs.registration_id = seed.registration_id
  AND attendance_logs.event_id = seed.event_id
  AND attendance_logs.user_id = seed.user_id
  AND attendance_logs.checked_in_by = seed.checked_in_by
  AND attendance_logs.checked_in_at = seed.checked_in_at;

DELETE FROM attendance_logs attendance
USING v15_target_attendance target
WHERE attendance.id = target.id;

DELETE FROM registrations registrations
USING v15_target_registrations target
WHERE registrations.id = target.id
  AND NOT EXISTS (
      SELECT 1
      FROM attendance_logs attendance
      WHERE attendance.registration_id = registrations.id
  );

DELETE FROM events events
USING v15_target_events target
WHERE events.id = target.id
  AND NOT EXISTS (
      SELECT 1
      FROM registrations registrations
      WHERE registrations.event_id = events.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM attendance_logs attendance
      WHERE attendance.event_id = events.id
  );

CREATE TEMP TABLE v15_deletable_users ON COMMIT DROP AS
SELECT target.id
FROM v15_target_users target
WHERE NOT EXISTS (
      SELECT 1
      FROM registrations registrations
      WHERE registrations.user_id = target.id
         OR registrations.approved_by = target.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM attendance_logs attendance
      WHERE attendance.user_id = target.id
         OR attendance.checked_in_by = target.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM events events
      WHERE events.created_by = target.id
  );

DELETE FROM two_factor_verifications verifications
USING v15_deletable_users users
WHERE verifications.user_id = users.id;

DELETE FROM organization_holders holders
USING v15_deletable_users users
WHERE holders.user_id = users.id;

DELETE FROM user_organizations memberships
USING v15_deletable_users users
WHERE memberships.user_id = users.id;

DELETE FROM user_roles user_roles
USING v15_deletable_users users
WHERE user_roles.user_id = users.id;

DELETE FROM users users
USING v15_deletable_users target
WHERE users.id = target.id;

DELETE FROM organizations organizations
USING v15_target_organizations target
WHERE organizations.id = target.id
  AND NOT EXISTS (
      SELECT 1
      FROM users users
      WHERE users.organization_id = organizations.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM events events
      WHERE events.organization_id = organizations.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM user_organizations memberships
      WHERE memberships.organization_id = organizations.id
  )
  AND NOT EXISTS (
      SELECT 1
      FROM organization_holders holders
      WHERE holders.organization_id = organizations.id
  );
