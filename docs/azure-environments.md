# Azure Deployment Checklist

This checklist is for configuring FAPOR7/FMS on Azure without committing secrets or changing cloud resources from the repository. It reflects the current codebase: Spring Boot backend, Azure PostgreSQL, Azure Blob Storage, React/Vite frontend, Azure Static Web Apps, and GitHub Actions.

For the concrete dev setup order and copy-only Azure CLI drafts, see `docs/azure/dev-setup-checklist.md` and `docs/azure/dev-setup-commands.example.azcli`.

## 1. Runtime Profiles

Do not commit `spring.profiles.active`. Set it in the runtime environment.

Local:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

`spring-boot:run` activates the local profile by default from `backend/.mvn/maven.config`. If you run the packaged JAR locally instead, pass `SPRING_PROFILES_ACTIVE=local` or `--spring.profiles.active=local`.

Dev App Service:

```text
SPRING_PROFILES_ACTIVE=dev
```

Prod App Service:

```text
SPRING_PROFILES_ACTIVE=prod
```

SSO is opt-in with additional profiles:

```text
SPRING_PROFILES_ACTIVE=dev,sso,sso-entra
SPRING_PROFILES_ACTIVE=prod,sso,sso-google
```

Use only the provider profile that is actually configured.

## 2. Local Configuration

Local development does not require Azure Storage credentials.

Common local settings:

| Setting | Status | Example |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Required | `local` |
| `DB_URL` | Optional | `jdbc:postgresql://localhost:5432/fms_dev` |
| `DB_USERNAME` | Optional | `fms` |
| `DB_PASSWORD` | Optional | `fmspass` |
| `JWT_SECRET` | Optional | `<local-only-secret>` |
| `CORS_ALLOWED_ORIGINS` | Optional | `http://localhost:5173,http://127.0.0.1:5173` |
| `APP_UPLOAD_BASE_PATH` | Optional | `uploads` |
| `APP_STORAGE_TYPE` | Optional | `local` |
| `APP_2FA_EMAIL_ENABLED` | Optional | `true` |
| `APP_2FA_EMAIL_LOG_CODES` | Optional local only | `true` |
| `ACS_EMAIL_ENABLED` | Optional local only | `false` |
| `ACS_EMAIL_CONNECTION_STRING` | Required only if ACS Email enabled | `<acs-email-connection-string>` |
| `ACS_EMAIL_SENDER_ADDRESS` | Required only if ACS Email enabled | `<sender@example.com>` |
| `ACS_EMAIL_SUBJECT` | Optional | `Fapor7 verification code` |
| `APP_2FA_SMS_ENABLED` | Optional | `false` |
| `SEMAPHORE_API_KEY` | Required only if SMS enabled | `<semaphore-api-key>` |
| `SEMAPHORE_SENDER_NAME` | Required only if SMS enabled | `<sender-name>` |
| `SEMAPHORE_BASE_URL` | Optional | `https://api.semaphore.co/api/v4/messages` |
| `APP_DEV_SEED_ENABLED` | Optional local only | `true` |
| `APP_DEV_SEED_PASSWORD` | Required if local seed enabled | `<local-seed-password>` |

Local uploads are filesystem-backed under `APP_UPLOAD_BASE_PATH`. Profile pictures are served at `/uploads/profile-pictures/<filename>`. Payment proofs are downloaded through the authenticated registration payment-proof endpoint.
The local profile provides the dummy secret `local-development-jwt-secret-change-before-nonlocal-use` when `JWT_SECRET` is unset. Do not copy that value to Azure.

## 3. Backend App Service Settings

Set these in Azure App Service Application Settings, not in source control.

### Dev

| Setting | Status | Placeholder |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Required | `dev` |
| `DB_URL` | Required | `jdbc:postgresql://<dev-server>.postgres.database.azure.com:5432/<database>?sslmode=require` |
| `DB_USERNAME` | Required | `<db-username>` |
| `DB_PASSWORD` | Required | `<db-password>` |
| `JWT_SECRET` | Required | `<strong-dev-secret>` |
| `JWT_EXPIRATION_MS` | Optional | `86400000` |
| `SERVER_FORWARD_HEADERS_STRATEGY` | Optional; required when using Front Door | `framework` |
| `CORS_ALLOWED_ORIGINS` | Required | `https://thankful-ground-077ba4800.7.azurestaticapps.net` |
| `APP_STORAGE_TYPE` | Recommended explicit | `azure-blob` |
| `AZURE_STORAGE_CONNECTION_STRING` | Required unless using account/key | `<dev-storage-connection-string>` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Alternative to connection string | `<dev-storage-account>` |
| `AZURE_STORAGE_ACCOUNT_KEY` | Alternative to connection string | `<dev-storage-key>` |
| `AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS` | Required | `payment-proofs` |
| `AZURE_STORAGE_CONTAINER_PROFILE_PICTURES` | Required | `profile-pictures` |
| `AZURE_STORAGE_CONTAINER_EVENT_RESOURCES` | Required | `event-resources` |
| `AZURE_STORAGE_CONTAINER_CERTIFICATES` | Required | `certificates` |
| `APP_PAYMENT_PROOF_MAX_SIZE_BYTES` | Optional | `10485760` |
| `APP_PAYMENT_PROOF_ALLOWED_CONTENT_TYPES` | Optional | `image/jpeg,image/png,application/pdf` |
| `APP_PAYMENT_PROOF_ALLOWED_EXTENSIONS` | Optional | `jpg,jpeg,png,pdf` |
| `APP_2FA_EMAIL_ENABLED` | Optional | `false` |
| `APP_2FA_SMS_ENABLED` | Optional | `false` |
| `APP_2FA_EMAIL_LOG_CODES` | Dev only, omit unless debugging | `false` |
| `ACS_EMAIL_ENABLED` | Required if email 2FA is enabled | `true` |
| `ACS_EMAIL_CONNECTION_STRING` | Required if ACS Email enabled | `<acs-email-connection-string>` |
| `ACS_EMAIL_SENDER_ADDRESS` | Required if ACS Email enabled | `<verified-sender-address>` |
| `ACS_EMAIL_SUBJECT` | Optional | `Fapor7 verification code` |
| `APP_2FA_LOG_CODES` | Not used by current code | Omit |
| `SEMAPHORE_API_KEY` | Required only if SMS enabled | `<semaphore-api-key>` |
| `SEMAPHORE_SENDER_NAME` | Required only if SMS enabled | `<sender-name>` |
| `SEMAPHORE_BASE_URL` | Optional | `https://api.semaphore.co/api/v4/messages` |
| `APP_DEV_SEED_ENABLED` | Dev only optional | `false` or `true` |
| `APP_DEV_SEED_PASSWORD` | Required if dev seed enabled | `<dev-seed-password>` |
| `INITIAL_ADMIN_EMAIL` | Optional bootstrap | `<admin-email>` |
| `INITIAL_ADMIN_PASSWORD` | Optional bootstrap | `<temporary-admin-password>` |
| `INITIAL_ADMIN_FULL_NAME` | Optional bootstrap | `<admin-name>` |
| `APP_SSO_ENABLED` | Optional when SSO profile active | `true` |
| `SSO_FRONTEND_SUCCESS_URI` | Required if SSO enabled | `https://thankful-ground-077ba4800.7.azurestaticapps.net/` |
| `ENTRA_CLIENT_ID` | Required only for Entra SSO | `<entra-client-id>` |
| `ENTRA_CLIENT_SECRET` | Required only for Entra SSO | `<entra-client-secret>` |
| `ENTRA_TENANT_ID` | Required only for Entra SSO | `<tenant-id>` |
| `GOOGLE_CLIENT_ID` | Required only for Google SSO | `<google-client-id>` |
| `GOOGLE_CLIENT_SECRET` | Required only for Google SSO | `<google-client-secret>` |

### Prod

| Setting | Status | Placeholder |
| --- | --- | --- |
| `SPRING_PROFILES_ACTIVE` | Required | `prod` |
| `DB_URL` | Required | `jdbc:postgresql://<prod-server>.postgres.database.azure.com:5432/<database>?sslmode=require` |
| `DB_USERNAME` | Required | `<db-username>` |
| `DB_PASSWORD` | Required | `<db-password>` |
| `JWT_SECRET` | Required | `<strong-prod-secret>` |
| `JWT_EXPIRATION_MS` | Optional | `86400000` |
| `SERVER_FORWARD_HEADERS_STRATEGY` | Required when using Front Door | `framework` |
| `CORS_ALLOWED_ORIGINS` | Required | `https://<prod-front-door-or-custom-domain>` |
| `APP_STORAGE_TYPE` | Recommended explicit | `azure-blob` |
| `AZURE_STORAGE_CONNECTION_STRING` | Required unless using account/key | `<prod-storage-connection-string>` |
| `AZURE_STORAGE_ACCOUNT_NAME` | Alternative to connection string | `<prod-storage-account>` |
| `AZURE_STORAGE_ACCOUNT_KEY` | Alternative to connection string | `<prod-storage-key>` |
| `AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS` | Required | `payment-proofs` |
| `AZURE_STORAGE_CONTAINER_PROFILE_PICTURES` | Required | `profile-pictures` |
| `AZURE_STORAGE_CONTAINER_EVENT_RESOURCES` | Required | `event-resources` |
| `AZURE_STORAGE_CONTAINER_CERTIFICATES` | Required | `certificates` |
| `APP_PAYMENT_PROOF_MAX_SIZE_BYTES` | Optional | `10485760` |
| `APP_PAYMENT_PROOF_ALLOWED_CONTENT_TYPES` | Optional | `image/jpeg,image/png,application/pdf` |
| `APP_PAYMENT_PROOF_ALLOWED_EXTENSIONS` | Optional | `jpg,jpeg,png,pdf` |
| `APP_2FA_EMAIL_ENABLED` | Optional | `false` |
| `APP_2FA_SMS_ENABLED` | Optional | `false` |
| `APP_2FA_EMAIL_LOG_CODES` | Omit in prod | Prod profile forces false |
| `ACS_EMAIL_ENABLED` | Required if email 2FA is enabled | `true` |
| `ACS_EMAIL_CONNECTION_STRING` | Required if ACS Email enabled | `<acs-email-connection-string>` |
| `ACS_EMAIL_SENDER_ADDRESS` | Required if ACS Email enabled | `<verified-sender-address>` |
| `ACS_EMAIL_SUBJECT` | Optional | `Fapor7 verification code` |
| `APP_2FA_LOG_CODES` | Not used by current code | Omit |
| `SEMAPHORE_API_KEY` | Required only if SMS enabled | `<semaphore-api-key>` |
| `SEMAPHORE_SENDER_NAME` | Required only if SMS enabled | `<sender-name>` |
| `SEMAPHORE_BASE_URL` | Optional | `https://api.semaphore.co/api/v4/messages` |
| `INITIAL_ADMIN_EMAIL` | One-time bootstrap unless admin exists | `<admin-email>` |
| `INITIAL_ADMIN_PASSWORD` | One-time bootstrap unless admin exists | `<temporary-admin-password>` |
| `INITIAL_ADMIN_FULL_NAME` | One-time bootstrap unless admin exists | `<admin-name>` |
| `APP_SSO_ENABLED` | Optional when SSO profile active | `true` |
| `SSO_FRONTEND_SUCCESS_URI` | Required if SSO enabled | `https://<prod-front-door-or-custom-domain>/` |
| `ENTRA_CLIENT_ID` | Required only for Entra SSO | `<entra-client-id>` |
| `ENTRA_CLIENT_SECRET` | Required only for Entra SSO | `<entra-client-secret>` |
| `ENTRA_TENANT_ID` | Required only for Entra SSO | `<tenant-id>` |
| `GOOGLE_CLIENT_ID` | Required only for Google SSO | `<google-client-id>` |
| `GOOGLE_CLIENT_SECRET` | Required only for Google SSO | `<google-client-secret>` |

Dev and prod startup fail if:

- `JWT_SECRET` is blank, the committed local-only value, or contains `change_this`.
- Blob Storage credentials or any required container name are missing or invalid.

Prod startup also fails if:

- `DB_URL` is blank, points to localhost/loopback, or a PostgreSQL URL without `sslmode=require`.
- `CORS_ALLOWED_ORIGINS` is blank, `*`, non-HTTPS, local, or malformed.
- Storage is not `azure-blob`.
- SQL logging is enabled.
- 2FA email code logging is enabled.

2FA delivery startup behavior:

- Local email/password login is the only app-side OTP 2FA flow. Microsoft Entra ID and Google SSO keep relying on provider-side MFA or conditional access and still return the FAPOR7 JWT through `#sso_token=<jwt>`.
- If `APP_2FA_EMAIL_ENABLED=true`, configure either local-only `APP_2FA_EMAIL_LOG_CODES=true` or ACS Email with `ACS_EMAIL_ENABLED=true`, `ACS_EMAIL_CONNECTION_STRING`, and `ACS_EMAIL_SENDER_ADDRESS`.
- Do not enable `APP_2FA_EMAIL_LOG_CODES` in shared dev or prod. It writes OTP codes to logs.
- If `APP_2FA_SMS_ENABLED=true`, configure Semaphore with `SEMAPHORE_API_KEY` and `SEMAPHORE_SENDER_NAME`. `SEMAPHORE_BASE_URL` can normally keep its default.
- OTP tuning is controlled by `APP_2FA_CODE_LENGTH`, `APP_2FA_EXPIRY_MINUTES`, `APP_2FA_RESEND_COOLDOWN_SECONDS`, `APP_2FA_MAX_FAILED_ATTEMPTS`, and `APP_2FA_MAX_CHALLENGES_PER_HOUR`.

`APP_STORAGE_TYPE=local` means filesystem-backed uploads. `APP_STORAGE_TYPE=azure-blob` means Azure Blob Storage backed uploads through `AzureBlobStorageService`.

## 4. Azure PostgreSQL

Use Azure Database for PostgreSQL and create one database per environment.

JDBC URL format:

```text
DB_URL=jdbc:postgresql://<server>.postgres.database.azure.com:5432/<database>?sslmode=require
```

Checklist:

- Create the database, for example `fms_dev` and `fms_prod`.
- Use the exact username format Azure gives you. Flexible Server commonly uses the configured admin username directly; older/single-server setups may require `<username>@<server-name>`.
- Set `sslmode=require` in `DB_URL`.
- Allow App Service outbound access through PostgreSQL firewall rules, or use VNet integration/private endpoint.
- Keep `spring.jpa.hibernate.ddl-auto=validate`; schema changes are handled by Flyway migrations.
- Flyway runs on backend startup and applies migrations from `backend/src/main/resources/db/migration`.
- Fresh prod databases should start from schema/reference migrations plus optional one-time `INITIAL_ADMIN_*`.
- `APP_DEV_SEED_ENABLED` is only for `local`/`dev`; do not enable demo seeding in prod.
- Migration `V15__remove_unsafe_seed_data.sql` removes old fixed demo seed data. Review before applying to any reused non-production database that intentionally contains those fixed rows.

## 5. Azure Blob Storage

Create one Storage Account per environment, or use clearly separated accounts with environment-scoped credentials.

Required private containers:

| Setting | Container |
| --- | --- |
| `AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS` | `payment-proofs` |
| `AZURE_STORAGE_CONTAINER_PROFILE_PICTURES` | `profile-pictures` |
| `AZURE_STORAGE_CONTAINER_EVENT_RESOURCES` | `event-resources` |
| `AZURE_STORAGE_CONTAINER_CERTIFICATES` | `certificates` |

Storage checklist:

- Disable public blob access at the storage account level when possible.
- Keep each container private.
- Use `AZURE_STORAGE_CONNECTION_STRING`, or set both `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY`.
- Do not use SAS tokens as App Settings unless a future implementation explicitly supports them.
- Do not store SAS URLs in the database.
- Payment proof database values are stable references such as `payment-proofs/<blob-name>`.
- Payment proofs are accessed through `GET /api/registrations/{id}/payment-proof`, protected by `MAIN_ADMIN` or `EVENT_ADMIN`.
- Profile images are stored in the private `profile-pictures` container but exposed through backend route `/uploads/profile-pictures/<filename>`.
- Profile images are public-by-URL user content because the existing frontend renders them directly.

Payment proof upload defaults:

| Setting | Default |
| --- | --- |
| `APP_PAYMENT_PROOF_MAX_SIZE_BYTES` | `10485760` |
| `APP_PAYMENT_PROOF_ALLOWED_CONTENT_TYPES` | `image/jpeg,image/png,application/pdf` |
| `APP_PAYMENT_PROOF_ALLOWED_EXTENSIONS` | `jpg,jpeg,png,pdf` |

Both content type and filename extension must be allowed and compatible.

## 6. Frontend Backend URL Strategy

The frontend supports an optional Vite build-time setting:

```text
VITE_API_BASE_URL=<backend-origin>
```

When `VITE_API_BASE_URL` is blank or unset, backend-owned paths stay relative. When it is set, the frontend prefixes only these backend-owned path families:

| Path | Backend purpose |
| --- | --- |
| `/api/**` | REST API, health, login, 2FA, users, organizations, events, registrations, payment-proof upload/download, attendance, and profile-picture upload |
| `/uploads/**` | Public-by-URL profile images streamed by the backend from local storage or private Blob Storage |
| `/oauth2/**` | Spring Security SSO authorization entry points such as `/oauth2/authorization/entra` and `/oauth2/authorization/google` |
| `/login/oauth2/**` | SSO provider callback paths such as `/login/oauth2/code/entra` and `/login/oauth2/code/google` |

Environment behavior:

| Environment | `VITE_API_BASE_URL` | Browser behavior |
| --- | --- | --- |
| Local | Blank/unset | Relative paths go through the Vite proxy to `http://localhost:8080` |
| Dev | `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` | Static Web App calls the backend App Service directly |
| Prod | Blank/unset | Relative paths stay same-origin for Front Door/custom-domain routing |

Current dev origins:

| Role | Origin |
| --- | --- |
| Frontend SWA | `https://thankful-ground-077ba4800.7.azurestaticapps.net` |
| Backend App Service | `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` |

The dev backend App Service must allow the direct SWA origin:

```text
CORS_ALLOWED_ORIGINS=https://thankful-ground-077ba4800.7.azurestaticapps.net
```

For dev SSO, provider redirect URIs use the backend App Service origin, for example:

```text
https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/login/oauth2/code/entra
https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/login/oauth2/code/google
```

Set the backend success redirect to the frontend SWA:

```text
SSO_FRONTEND_SUCCESS_URI=https://thankful-ground-077ba4800.7.azurestaticapps.net/
```

Auth and session assumptions:

- API calls use `Authorization: Bearer <jwt>` from frontend `localStorage`.
- Normal API auth does not depend on cookies.
- SSO, when enabled, uses a temporary backend session during the provider redirect, then redirects to `SSO_FRONTEND_SUCCESS_URI#sso_token=<jwt>`.
- Payment proofs stay under `/api/registrations/{id}/payment-proof` and remain JWT protected.
- Profile images may be returned as `/uploads/profile-pictures/<filename>` and are rewritten by the frontend to the backend App Service origin in dev.

Azure Static Web Apps API integration is practical for `/api/**`, but it does not cover this app's non-API backend paths. `staticwebapp.config.json` is still useful for SPA fallback and security headers, but it cannot replace a reverse proxy for arbitrary external App Service paths.

### Routing Decision

Dev uses the Static Web App frontend plus direct backend App Service calls to avoid Azure Front Door cost.

Prod should use Azure Front Door or an equivalent path-aware reverse proxy later. Keep `VITE_API_BASE_URL` blank/unset in prod so the browser uses same-origin relative paths.

Future prod route rules:

| Path pattern | Origin |
| --- | --- |
| `/api/*` | Backend App Service |
| `/uploads/*` | Backend App Service |
| `/oauth2/*` | Backend App Service |
| `/login/oauth2/*` | Backend App Service |
| `/*` | Static Web Apps |

Exact backend App Service settings for future prod Front Door/custom-domain routing:

```text
CORS_ALLOWED_ORIGINS=https://<front-door-or-custom-domain>
SSO_FRONTEND_SUCCESS_URI=https://<front-door-or-custom-domain>/
SERVER_FORWARD_HEADERS_STRATEGY=framework
```

`staticwebapp.config.json`:

- Not currently present.
- Recommended before production for SPA navigation fallback and security headers.
- It cannot by itself proxy `/uploads`, `/oauth2`, or `/login/oauth2` to an external App Service.

## 7. SSO Setup

Enable SSO only after the backend route paths are reachable from the frontend origin.

Profiles:

- Base SSO: add `sso`.
- Entra: add `sso-entra`.
- Google: add `sso-google`.

Provider redirect URIs:

- Entra: `https://<backend-origin>/login/oauth2/code/entra`
- Google: `https://<backend-origin>/login/oauth2/code/google`

Set `SSO_FRONTEND_SUCCESS_URI` to the frontend landing URL, usually `https://<frontend-origin>/`.

## 8. GitHub Actions

The dev backend workflow uses Azure OIDC. The prod workflow still uses publish profiles until prod is explicitly migrated later.

GitHub Environments:

- `dev`
- `prod`

Recommended protection:

- `dev`: optional reviewers.
- `prod`: required reviewers and branch protection for `main`.

Dev workflow:

- File: `.github/workflows/azure-dev.yml`
- Trigger: push to `develop` and manual `workflow_dispatch`.
- Guard: manual dispatch fails unless run from `develop`.
- Backend: tests, packages JAR, signs in with `azure/login@v2`, and deploys with `azure/webapps-deploy@v3`.
- Frontend: builds Vite app with `VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL_DEV }}`, then deploys `frontend/dist` with `Azure/static-web-apps-deploy@v1`.

Required dev Azure OIDC setup:

| Azure item | Required value |
| --- | --- |
| App registration display name | `github-fms-dev-deploy` |
| Federated credential subject | `repo:daniel40799/fms:ref:refs/heads/develop` |
| Federated credential issuer | `https://token.actions.githubusercontent.com` |
| Federated credential audience | `api://AzureADTokenExchange` |
| Role assignment | `Contributor` on `rg-fms-dev` |

Required dev GitHub secrets:

| Secret | Status |
| --- | --- |
| `AZURE_CLIENT_ID_DEV` | Required for Azure OIDC |
| `AZURE_TENANT_ID_DEV` | Required for Azure OIDC |
| `AZURE_SUBSCRIPTION_ID_DEV` | Required for Azure OIDC |
| `AZURE_WEBAPP_NAME_DEV` | Required |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV` | Required |

Required dev GitHub Environment variable:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL_DEV` | `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` |

`AZURE_WEBAPP_PUBLISH_PROFILE_DEV` is no longer used by the dev workflow.

Prod workflow:

- File: `.github/workflows/azure-prod.yml`
- Trigger: push to `main` and manual `workflow_dispatch`.
- Guard: manual dispatch fails unless run from `main`.

Required prod GitHub secrets:

| Secret | Status |
| --- | --- |
| `AZURE_WEBAPP_NAME_PROD` | Required |
| `AZURE_WEBAPP_PUBLISH_PROFILE_PROD` | Required for current workflow |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD` | Required |

OIDC alternative:

- Dev is now wired for OIDC.
- Prod is not yet wired for OIDC; migrate it separately with prod-scoped Azure client, tenant, subscription, and app identifiers.

Do not place database passwords, JWT secrets, Azure Storage keys, provider secrets, or App Service Application Settings in GitHub unless the workflow is explicitly changed to manage App Settings.

## 9. Dev Deployment Smoke Test

Backend smoke test:

- Confirm App Service starts with `SPRING_PROFILES_ACTIVE=dev`.
- Check App Service logs for successful Flyway migration.
- Call `GET https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/api/health`.
- Create or bootstrap an admin.
- Log in through `POST https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/api/auth/login`.
- Call a JWT-protected endpoint such as `GET https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/api/me`.
- Verify CORS from `https://thankful-ground-077ba4800.7.azurestaticapps.net`.
- Upload a payment proof using JPG, PNG, or PDF under 10 MB.
- Download the payment proof as an event/main admin.
- Upload a profile picture.
- Verify blobs are created in `payment-proofs` and `profile-pictures`.
- Verify registration/user rows store stable references or `/uploads/profile-pictures/<filename>`, not machine-local paths or SAS URLs.

Frontend smoke test:

- Open `https://thankful-ground-077ba4800.7.azurestaticapps.net`.
- Confirm no browser network request goes to `localhost`.
- Confirm `/api`, `/uploads`, and `/oauth2` browser requests go to `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net`.
- Log in from the frontend.
- Navigate to protected pages.
- Upload payment proof and profile picture through the UI.
- Refresh a nested route to confirm SPA fallback behavior.
- If SSO is enabled, test provider redirect and return to `SSO_FRONTEND_SUCCESS_URI`.

GitHub Actions smoke test:

- Push to `develop` and verify `azure-dev.yml` runs.
- Confirm backend test/package/deploy steps succeed.
- Confirm frontend build/deploy steps succeed.
- Confirm manual dev dispatch fails from branches other than `develop`.
- For prod rehearsal, confirm `azure-prod.yml` is protected and only runs from `main`.

## 10. Final Pre-Deployment Checklist

Before first dev deployment:

- Azure PostgreSQL dev database exists.
- App Service dev Application Settings are complete.
- Storage account dev exists with all four private containers.
- Static Web App dev exists.
- Backend dev `CORS_ALLOWED_ORIGINS` contains `https://thankful-ground-077ba4800.7.azurestaticapps.net`.
- GitHub `dev` Environment variable `VITE_API_BASE_URL_DEV` is set to `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net`.
- GitHub `dev` environment and secrets exist.
- `develop` branch has the intended code.

Before first prod deployment:

- Azure PostgreSQL prod database exists and is empty or intentionally migrated.
- App Service prod Application Settings are complete.
- `INITIAL_ADMIN_*` is set for first boot, or a main admin already exists.
- Storage account prod exists with all four private containers and public access disabled.
- Frontend production routing is confirmed for `/api`, `/uploads`, `/oauth2`, and `/login/oauth2`.
- `CORS_ALLOWED_ORIGINS` contains only production HTTPS origins.
- `APP_2FA_EMAIL_LOG_CODES` is omitted in prod.
- GitHub `prod` environment has reviewers/protection and secrets.
- `main` branch has the intended code.
