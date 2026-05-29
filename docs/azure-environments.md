# Azure Environment Readiness

This pass prepares separate `local`, `dev`, and `prod` Spring profiles without committing secrets or changing existing Flyway history.

## Spring Profiles

Do not commit `spring.profiles.active`. Select the profile at runtime:

```powershell
$env:SPRING_PROFILES_ACTIVE='local'
$env:SPRING_PROFILES_ACTIVE='dev'
$env:SPRING_PROFILES_ACTIVE='prod'
```

Local development defaults live in `backend/src/main/resources/application-local.yml`. Dev and prod expect Azure settings from environment variables or Azure App Service Application Settings.

## Local Setup

Local PostgreSQL defaults still match `docker-compose.yml`:

- `DB_URL=jdbc:postgresql://localhost:5432/fms_dev`
- `DB_USERNAME=fms`
- `DB_PASSWORD=fmspass`

Useful local overrides:

- `JWT_SECRET` for a non-default local signing key
- `JWT_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `APP_UPLOAD_BASE_PATH=uploads`
- `APP_2FA_EMAIL_ENABLED=true`
- `APP_2FA_EMAIL_LOG_CODES=true`
- `APP_DEV_SEED_ENABLED=true`
- `APP_DEV_SEED_PASSWORD=local-dev-only-password`

The local/dev seeder is idempotent and only runs under `local` or `dev`. It creates demo users, organizations, events, registrations, and one attendance log only when enabled.

## Azure App Service Settings

Set these in each backend App Service.

Dev:

- `SPRING_PROFILES_ACTIVE=dev`
- `DB_URL=jdbc:postgresql://<dev-server>.postgres.database.azure.com:5432/<database>?sslmode=require`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS=86400000`
- `CORS_ALLOWED_ORIGINS=https://<dev-static-web-app>.azurestaticapps.net`
- `APP_UPLOAD_BASE_PATH=uploads`
- `APP_2FA_EMAIL_ENABLED=false`
- `APP_2FA_SMS_ENABLED=false`
- `SEMAPHORE_API_KEY` only if SMS is enabled
- `SEMAPHORE_SENDER_NAME` only if SMS is enabled
- `APP_DEV_SEED_ENABLED=true` only when the shared Azure dev environment should receive sample data
- `APP_DEV_SEED_PASSWORD` required when dev seeding is enabled
- `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID` only if Entra SSO is enabled
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` only if Google SSO is enabled
- `SSO_FRONTEND_SUCCESS_URI=https://<dev-frontend-origin>/` if SSO is enabled

Prod:

- `SPRING_PROFILES_ACTIVE=prod`
- `DB_URL=jdbc:postgresql://<prod-server>.postgres.database.azure.com:5432/<database>?sslmode=require`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRATION_MS=86400000`
- `CORS_ALLOWED_ORIGINS=https://<prod-static-web-app>.azurestaticapps.net,https://<custom-domain>`
- `APP_UPLOAD_BASE_PATH=<non-default persistent path>` until Azure Blob Storage is implemented
- `APP_2FA_EMAIL_ENABLED=false`
- `APP_2FA_SMS_ENABLED=false`
- `SEMAPHORE_API_KEY` only if SMS is enabled
- `SEMAPHORE_SENDER_NAME` only if SMS is enabled
- `ENTRA_CLIENT_ID`, `ENTRA_CLIENT_SECRET`, `ENTRA_TENANT_ID` only if Entra SSO is enabled
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` only if Google SSO is enabled
- `SSO_FRONTEND_SUCCESS_URI=https://<prod-frontend-origin>/` if SSO is enabled

Prod startup validates that `JWT_SECRET` is non-default, `DB_URL` is not local and contains `sslmode=require`, CORS origins are explicit HTTPS origins, default/local upload paths are not used, SQL logging is disabled, and 2FA verification codes are not logged.

## Initial Prod Admin

Prod does not use a committed default admin password. To bootstrap the first admin, set all three variables for one startup:

- `INITIAL_ADMIN_EMAIL`
- `INITIAL_ADMIN_PASSWORD`
- `INITIAL_ADMIN_FULL_NAME`

The bootstrapper skips when any `MAIN_ADMIN` already exists and never overwrites an existing admin. Remove these settings after the first admin is created.

## Flyway And Demo Data

Existing migrations were not edited or deleted. `V15__remove_unsafe_seed_data.sql` is a forward-only cleanup that targets fixed seed users, demo organizations, demo events, demo registrations, and demo attendance rows from earlier migrations.

If an existing non-production database intentionally uses those fixed seed rows, review before applying `V15` because it is destructive. Fresh prod databases end with schema/reference data only; local/dev demo data is added by `DevDataSeeder` when enabled.

## Frontend Routing

The frontend keeps relative calls such as `/api`, `/oauth2`, and `/uploads`. Local Vite proxying remains in `frontend/vite.config.ts`.

Production must route `/api` and OAuth callback paths by one of these approaches:

- Azure Static Web Apps linked backend/API routing to the App Service backend.
- A future explicit `VITE_API_BASE_URL` strategy that prefixes API calls at build time.

No frontend secrets should be added. Vite environment variables are bundled into browser assets.

## GitHub Actions

Workflow drafts:

- `.github/workflows/azure-dev.yml`: `develop` branch deploys the dev environment.
- `.github/workflows/azure-prod.yml`: `main` branch deploys the prod environment.
- `.github/workflows/azure-static-web-apps-black-flower-026de4e00.yml`: legacy workflow notice only.

Required GitHub Environments:

- `dev`
- `prod` with required reviewers or equivalent protection

Required GitHub Secrets for publish-profile deployment:

- `AZURE_WEBAPP_NAME_DEV`
- `AZURE_WEBAPP_PUBLISH_PROFILE_DEV`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV`
- `AZURE_WEBAPP_NAME_PROD`
- `AZURE_WEBAPP_PUBLISH_PROFILE_PROD`
- `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD`

OIDC can replace publish profiles later with explicit environment-scoped Azure client, tenant, and subscription secrets. Do not commit publish profiles, deployment tokens, database passwords, JWT secrets, or provider secrets.

## Current Upload Limitation

Uploads are still local filesystem based through `APP_UPLOAD_BASE_PATH`. This is acceptable for local/dev validation. Prod now rejects obvious local defaults such as `uploads`, but Azure Blob Storage is still a separate follow-up task before production upload durability is complete.
