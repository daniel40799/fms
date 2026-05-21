INSERT INTO roles (id, name, description) VALUES
    (gen_random_uuid(), 'MAIN_ADMIN', 'Maintains the entire site'),
    (gen_random_uuid(), 'USER_ADMIN', 'Maintains user information and profile fields'),
    (gen_random_uuid(), 'EVENT_ADMIN', 'Maintains events'),
    (gen_random_uuid(), 'ORGANIZATION_ADMIN', 'Maintains organization user affiliations'),
    (gen_random_uuid(), 'EXHIBITOR', 'Scans participant QR codes for engagement'),
    (gen_random_uuid(), 'END_USER', 'Updates profile and registers to events')
ON CONFLICT (name) DO UPDATE
SET description = EXCLUDED.description;
