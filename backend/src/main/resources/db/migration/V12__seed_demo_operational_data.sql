WITH seed_organizations (id, name, code) AS (
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
)
INSERT INTO organizations (
    id,
    name,
    code,
    status,
    created_at,
    updated_at
)
SELECT
    seed_organizations.id,
    seed_organizations.name,
    seed_organizations.code,
    'ACTIVE',
    TIMESTAMP '2026-05-01 08:00:00',
    TIMESTAMP '2026-05-01 08:00:00'
FROM seed_organizations
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

WITH seed_numbers AS (
    SELECT generate_series(1, 24) AS seed_number
),
main_admin AS (
    SELECT password_hash
    FROM users
    WHERE email = 'daniel@fapor7.org'
)
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    first_name,
    middle_name,
    last_name,
    birthday,
    sex,
    address,
    mobile_number,
    prc_number,
    status,
    organization_id,
    created_at,
    updated_at
)
SELECT
    format('88000000-0000-0000-0000-%s', lpad(seed_numbers.seed_number::TEXT, 12, '0'))::UUID,
    format('member.user%s@example.test', lpad(seed_numbers.seed_number::TEXT, 2, '0')),
    main_admin.password_hash,
    format('Demo Participant %s', lpad(seed_numbers.seed_number::TEXT, 2, '0')),
    'Demo',
    CASE WHEN seed_numbers.seed_number % 3 = 0 THEN 'Sample' ELSE NULL END,
    format('Participant %s', lpad(seed_numbers.seed_number::TEXT, 2, '0')),
    DATE '1988-01-01' + seed_numbers.seed_number,
    CASE WHEN seed_numbers.seed_number % 2 = 0 THEN 'Female' ELSE 'Male' END,
    format('Unit %s, Cebu Demo District', seed_numbers.seed_number),
    format('+63917100%s', lpad(seed_numbers.seed_number::TEXT, 3, '0')),
    lpad((3000000 + seed_numbers.seed_number)::TEXT, 7, '0'),
    'ACTIVE',
    organizations.id,
    TIMESTAMP '2026-05-01 09:00:00',
    TIMESTAMP '2026-05-01 09:00:00'
FROM seed_numbers
CROSS JOIN main_admin
JOIN organizations
    ON organizations.code = format('DEMO-%s', lpad((((seed_numbers.seed_number - 1) % 12) + 1)::TEXT, 2, '0'))
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    first_name = EXCLUDED.first_name,
    middle_name = EXCLUDED.middle_name,
    last_name = EXCLUDED.last_name,
    birthday = EXCLUDED.birthday,
    sex = EXCLUDED.sex,
    address = EXCLUDED.address,
    mobile_number = EXCLUDED.mobile_number,
    prc_number = EXCLUDED.prc_number,
    status = EXCLUDED.status,
    organization_id = EXCLUDED.organization_id,
    updated_at = EXCLUDED.updated_at;

INSERT INTO user_roles (
    user_id,
    role_id
)
SELECT
    users.id,
    roles.id
FROM users
CROSS JOIN roles
WHERE users.email LIKE 'member.user%@example.test'
  AND roles.name = 'END_USER'
ON CONFLICT (user_id, role_id) DO NOTHING;

WITH seed_events (
    id,
    title,
    description,
    venue,
    start_date,
    end_date,
    capacity,
    registration_open,
    registration_close,
    registration_price,
    horizontal_poster_url,
    vertical_poster_url,
    status,
    organization_code
) AS (
    VALUES
        ('99000000-0000-0000-0000-000000000001'::UUID, 'Region Seven Professional Convention', 'A plenary convention for member organizations, professional practice updates, and cross-sector networking.', 'Waterfront Cebu City Hotel', TIMESTAMP '2026-06-06 08:00:00', TIMESTAMP '2026-06-06 17:30:00', 750, TIMESTAMP '2026-05-20 08:00:00', TIMESTAMP '2026-06-05 18:00:00', 1800.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'PUBLISHED', 'DEMO-01'),
        ('99000000-0000-0000-0000-000000000002'::UUID, 'Practice Innovation Expo', 'Interactive exhibits, case studies, and professional tools for modern regional practice.', 'SM Seaside City Cebu Convention Hall', TIMESTAMP '2026-06-13 09:00:00', TIMESTAMP '2026-06-13 18:00:00', 500, TIMESTAMP '2026-05-21 08:00:00', TIMESTAMP '2026-06-12 18:00:00', 950.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'PUBLISHED', 'DEMO-08'),
        ('99000000-0000-0000-0000-000000000003'::UUID, 'Continuing Competence Summit', 'A CPD-focused summit with track sessions for compliance, ethics, and practice leadership.', 'Cebu Business Park Forum', TIMESTAMP '2026-06-20 08:30:00', TIMESTAMP '2026-06-20 17:00:00', 420, TIMESTAMP '2026-05-22 08:00:00', TIMESTAMP '2026-06-19 17:00:00', 1250.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'PUBLISHED', 'DEMO-07'),
        ('99000000-0000-0000-0000-000000000004'::UUID, 'Built Environment Safety Forum', 'Regulatory, design, and field safety sessions for the built environment community.', 'IEC Convention Center Cebu', TIMESTAMP '2026-07-04 08:00:00', TIMESTAMP '2026-07-04 16:30:00', 360, TIMESTAMP '2026-05-25 08:00:00', TIMESTAMP '2026-07-03 17:00:00', 1100.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'PUBLISHED', 'DEMO-04'),
        ('99000000-0000-0000-0000-000000000005'::UUID, 'Health Practice Quality Congress', 'Regional quality improvement sessions, clinical collaboration, and service standards discussions.', 'Marco Polo Plaza Cebu', TIMESTAMP '2026-07-11 08:00:00', TIMESTAMP '2026-07-11 17:30:00', 540, TIMESTAMP '2026-05-25 08:00:00', TIMESTAMP '2026-07-10 18:00:00', 1650.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'PUBLISHED', 'DEMO-03'),
        ('99000000-0000-0000-0000-000000000006'::UUID, 'Finance Governance Roundtable', 'Controls, reporting, and responsible financial practice for professional organizations.', 'Cebu Finance Center Auditorium', TIMESTAMP '2026-07-18 13:00:00', TIMESTAMP '2026-07-18 18:00:00', 240, TIMESTAMP '2026-05-27 08:00:00', TIMESTAMP '2026-07-17 17:00:00', 700.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'PUBLISHED', 'DEMO-05'),
        ('99000000-0000-0000-0000-000000000007'::UUID, 'Professional Ethics Assembly', 'Ethics, due process, and public trust sessions for cross-discipline practitioners.', 'University of San Carlos Performing Arts Hall', TIMESTAMP '2026-08-01 08:30:00', TIMESTAMP '2026-08-01 16:30:00', 390, TIMESTAMP '2026-06-01 08:00:00', TIMESTAMP '2026-07-31 18:00:00', 900.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'PUBLISHED', 'DEMO-06'),
        ('99000000-0000-0000-0000-000000000008'::UUID, 'Green Practice Expo', 'Sustainability exhibits, audit methods, and practical environmental performance sessions.', 'Ayala Center Cebu Activity Hall', TIMESTAMP '2026-08-15 09:00:00', TIMESTAMP '2026-08-15 18:00:00', 480, TIMESTAMP '2026-06-04 08:00:00', TIMESTAMP '2026-08-14 18:00:00', 850.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'PUBLISHED', 'DEMO-09'),
        ('99000000-0000-0000-0000-000000000009'::UUID, 'Hospitality Standards Workshop', 'Service standards, assessment workflows, and participant engagement for hospitality professionals.', 'NUSTAR Convention Rooms', TIMESTAMP '2026-08-29 09:00:00', TIMESTAMP '2026-08-29 17:00:00', 260, TIMESTAMP '2026-06-08 08:00:00', TIMESTAMP '2026-08-28 18:00:00', 650.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'PUBLISHED', 'DEMO-10'),
        ('99000000-0000-0000-0000-000000000010'::UUID, 'Maritime Competence Day', 'Competence tracking, operational updates, and regional practice exchange.', 'Mandaue Waterfront Hall', TIMESTAMP '2026-09-05 08:00:00', TIMESTAMP '2026-09-05 17:00:00', 320, TIMESTAMP '2026-06-12 08:00:00', TIMESTAMP '2026-09-04 18:00:00', 1000.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'PUBLISHED', 'DEMO-11'),
        ('99000000-0000-0000-0000-000000000011'::UUID, 'Creative Practice Exchange', 'Portfolio clinics, industry standards, and professional collaboration for creative practitioners.', 'Cebu IT Park Events Pavilion', TIMESTAMP '2026-09-12 10:00:00', TIMESTAMP '2026-09-12 18:00:00', 300, TIMESTAMP '2026-06-15 08:00:00', TIMESTAMP '2026-09-11 18:00:00', 800.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'PUBLISHED', 'DEMO-12'),
        ('99000000-0000-0000-0000-000000000012'::UUID, 'Engineering Field Leadership Forum', 'Field leadership, safety records, and project delivery sessions for engineers.', 'Radisson Blu Cebu', TIMESTAMP '2026-09-19 08:00:00', TIMESTAMP '2026-09-19 17:30:00', 450, TIMESTAMP '2026-06-20 08:00:00', TIMESTAMP '2026-09-18 18:00:00', 1400.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'PUBLISHED', 'DEMO-02'),
        ('99000000-0000-0000-0000-000000000013'::UUID, 'Draft Sponsor Briefing', 'Draft record for event lifecycle action testing.', 'To be confirmed', TIMESTAMP '2026-10-03 09:00:00', TIMESTAMP '2026-10-03 12:00:00', 80, TIMESTAMP '2026-07-01 08:00:00', TIMESTAMP '2026-10-02 18:00:00', 0.00, '/seed-posters/convention-wide.png', '/seed-posters/convention-portrait.png', 'DRAFT', 'DEMO-01'),
        ('99000000-0000-0000-0000-000000000014'::UUID, 'Archived Pilot Attendance Day', 'Archived record for lifecycle history and administrative event views.', 'Cebu Pilot Venue', TIMESTAMP '2026-04-18 08:00:00', TIMESTAMP '2026-04-18 17:00:00', 120, TIMESTAMP '2026-03-01 08:00:00', TIMESTAMP '2026-04-17 18:00:00', 500.00, '/seed-posters/expo-wide.png', '/seed-posters/expo-portrait.png', 'ARCHIVED', 'DEMO-08')
),
event_admin AS (
    SELECT id
    FROM users
    WHERE email = 'event.admin@fapor7.org'
)
INSERT INTO events (
    id,
    title,
    description,
    venue,
    start_date,
    end_date,
    capacity,
    registration_open,
    registration_close,
    registration_price,
    horizontal_poster_url,
    vertical_poster_url,
    status,
    organization_id,
    created_by,
    created_at,
    updated_at
)
SELECT
    seed_events.id,
    seed_events.title,
    seed_events.description,
    seed_events.venue,
    seed_events.start_date,
    seed_events.end_date,
    seed_events.capacity,
    seed_events.registration_open,
    seed_events.registration_close,
    seed_events.registration_price,
    seed_events.horizontal_poster_url,
    seed_events.vertical_poster_url,
    seed_events.status,
    organizations.id,
    event_admin.id,
    TIMESTAMP '2026-05-01 10:00:00',
    TIMESTAMP '2026-05-01 10:00:00'
FROM seed_events
JOIN organizations ON organizations.code = seed_events.organization_code
CROSS JOIN event_admin
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    venue = EXCLUDED.venue,
    start_date = EXCLUDED.start_date,
    end_date = EXCLUDED.end_date,
    capacity = EXCLUDED.capacity,
    registration_open = EXCLUDED.registration_open,
    registration_close = EXCLUDED.registration_close,
    registration_price = EXCLUDED.registration_price,
    horizontal_poster_url = EXCLUDED.horizontal_poster_url,
    vertical_poster_url = EXCLUDED.vertical_poster_url,
    status = EXCLUDED.status,
    organization_id = EXCLUDED.organization_id,
    created_by = EXCLUDED.created_by,
    updated_at = EXCLUDED.updated_at;

WITH seed_numbers AS (
    SELECT generate_series(1, 24) AS seed_number
),
event_admin AS (
    SELECT id
    FROM users
    WHERE email = 'event.admin@fapor7.org'
)
INSERT INTO registrations (
    id,
    event_id,
    user_id,
    status,
    registered_at,
    updated_at,
    payment_reference,
    payment_file_path,
    payment_uploaded_at,
    approved_by,
    approved_at,
    remarks,
    qr_token,
    qr_generated_at
)
SELECT
    format('aa000000-0000-0000-0000-%s', lpad(seed_numbers.seed_number::TEXT, 12, '0'))::UUID,
    format('99000000-0000-0000-0000-%s', lpad(((((seed_numbers.seed_number - 1) % 12) + 1)::TEXT), 12, '0'))::UUID,
    format('88000000-0000-0000-0000-%s', lpad(seed_numbers.seed_number::TEXT, 12, '0'))::UUID,
    CASE
        WHEN seed_numbers.seed_number <= 12 THEN 'CONFIRMED'
        WHEN seed_numbers.seed_number <= 18 THEN 'PAYMENT_UPLOADED'
        WHEN seed_numbers.seed_number <= 22 THEN 'PENDING_PAYMENT'
        ELSE 'CANCELLED'
    END,
    TIMESTAMP '2026-05-24 09:00:00' + make_interval(days => seed_numbers.seed_number),
    TIMESTAMP '2026-05-24 09:30:00' + make_interval(days => seed_numbers.seed_number),
    CASE
        WHEN seed_numbers.seed_number <= 18 THEN format('DEMO-PAY-%s', lpad(seed_numbers.seed_number::TEXT, 4, '0'))
        ELSE NULL
    END,
    NULL,
    CASE
        WHEN seed_numbers.seed_number <= 18 THEN TIMESTAMP '2026-05-24 09:15:00' + make_interval(days => seed_numbers.seed_number)
        ELSE NULL
    END,
    CASE
        WHEN seed_numbers.seed_number <= 12 THEN event_admin.id
        ELSE NULL
    END,
    CASE
        WHEN seed_numbers.seed_number <= 12 THEN TIMESTAMP '2026-05-24 09:30:00' + make_interval(days => seed_numbers.seed_number)
        ELSE NULL
    END,
    CASE
        WHEN seed_numbers.seed_number <= 12 THEN 'Seeded confirmation for QR and attendance testing.'
        WHEN seed_numbers.seed_number > 22 THEN 'Seeded cancellation row.'
        ELSE NULL
    END,
    CASE
        WHEN seed_numbers.seed_number <= 12 THEN format('demo-qr-%s', lpad(seed_numbers.seed_number::TEXT, 4, '0'))
        ELSE NULL
    END,
    CASE
        WHEN seed_numbers.seed_number <= 12 THEN TIMESTAMP '2026-05-24 09:30:00' + make_interval(days => seed_numbers.seed_number)
        ELSE NULL
    END
FROM seed_numbers
CROSS JOIN event_admin
ON CONFLICT (id) DO UPDATE
SET event_id = EXCLUDED.event_id,
    user_id = EXCLUDED.user_id,
    status = EXCLUDED.status,
    registered_at = EXCLUDED.registered_at,
    updated_at = EXCLUDED.updated_at,
    payment_reference = EXCLUDED.payment_reference,
    payment_file_path = EXCLUDED.payment_file_path,
    payment_uploaded_at = EXCLUDED.payment_uploaded_at,
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at,
    remarks = EXCLUDED.remarks,
    qr_token = EXCLUDED.qr_token,
    qr_generated_at = EXCLUDED.qr_generated_at;

WITH seed_numbers AS (
    SELECT generate_series(1, 12) AS seed_number
),
event_admin AS (
    SELECT id
    FROM users
    WHERE email = 'event.admin@fapor7.org'
)
INSERT INTO attendance_logs (
    id,
    registration_id,
    event_id,
    user_id,
    checked_in_by,
    checked_in_at
)
SELECT
    format('bb000000-0000-0000-0000-%s', lpad(seed_numbers.seed_number::TEXT, 12, '0'))::UUID,
    registrations.id,
    registrations.event_id,
    registrations.user_id,
    event_admin.id,
    TIMESTAMP '2026-06-06 07:45:00' + make_interval(mins => seed_numbers.seed_number * 4)
FROM seed_numbers
JOIN registrations
    ON registrations.id = format('aa000000-0000-0000-0000-%s', lpad(seed_numbers.seed_number::TEXT, 12, '0'))::UUID
CROSS JOIN event_admin
ON CONFLICT (id) DO UPDATE
SET registration_id = EXCLUDED.registration_id,
    event_id = EXCLUDED.event_id,
    user_id = EXCLUDED.user_id,
    checked_in_by = EXCLUDED.checked_in_by,
    checked_in_at = EXCLUDED.checked_in_at;
