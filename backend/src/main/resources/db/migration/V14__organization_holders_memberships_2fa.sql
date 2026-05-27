CREATE TABLE user_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    confirmed_by UUID,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_user_organizations_user_organization UNIQUE (user_id, organization_id),
    CONSTRAINT fk_user_organizations_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_organizations_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_organizations_confirmed_by
        FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO user_organizations (
    user_id,
    organization_id,
    status,
    confirmed_at,
    created_at,
    updated_at
)
SELECT
    id,
    organization_id,
    'CONFIRMED',
    NOW(),
    COALESCE(created_at, NOW()),
    COALESCE(updated_at, NOW())
FROM users
WHERE organization_id IS NOT NULL
ON CONFLICT (user_id, organization_id) DO NOTHING;

CREATE TABLE organization_holders (
    organization_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (organization_id, user_id),
    CONSTRAINT fk_organization_holders_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
    CONSTRAINT fk_organization_holders_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO organization_holders (organization_id, user_id)
SELECT u.organization_id, u.id
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
WHERE u.organization_id IS NOT NULL
  AND r.name = 'ORGANIZATION_ADMIN'
ON CONFLICT (organization_id, user_id) DO NOTHING;

CREATE TABLE two_factor_verifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    channel VARCHAR(20) NOT NULL,
    destination VARCHAR(255) NOT NULL,
    code_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    failed_attempt_count INTEGER NOT NULL DEFAULT 0,
    resend_count INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    consumed_at TIMESTAMP,
    last_sent_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_two_factor_verifications_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_organizations_organization_status
    ON user_organizations(organization_id, status);

CREATE INDEX idx_two_factor_verifications_user_status
    ON two_factor_verifications(user_id, status);
