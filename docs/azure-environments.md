# Azure Deployment Checklist

This checklist is for configuring FAPOR7/FMS on Azure without committing secrets or changing cloud resources from the repository. It reflects the current codebase: Spring Boot backend, Azure PostgreSQL, Azure Blob Storage, React/Vite frontend, Azure Static Web Apps, and GitHub Actions.

For the concrete dev setup order and copy-only Azure CLI drafts, see `docs/azure/dev-setup-checklist.md` and `docs/azure/dev-setup-commands.example.azcli`.

## 1. Runtime Profiles

Do not commit `spring.profiles.active`. Set it in the runtime environment.

Local:

```powershell
$env:SPRING_PROFILES_ACTIVE='local'
```

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
| `APP_DEV_SEED_ENABLED` | Optional local only | `true` |
| `APP_DEV_SEED_PASSWORD` | Required if local seed enabled | `<local-seed-password>` |

Local uploads are filesystem-backed under `APP_UPLOAD_BASE_PATH`. Profile pictures are served at `/uploads/profile-pictures/<filename>`. Payment proofs are downloaded through the authenticated registration payment-proof endpoint.

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
| `SERVER_FORWARD_HEADERS_STRATEGY` | Required when using Front Door | `framework` |
| `CORS_ALLOWED_ORIGINS` | Required | `https://<dev-front-door-or-custom-domain>` |
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
| `SSO_FRONTEND_SUCCESS_URI` | Required if SSO enabled | `https://<dev-frontend-origin>/` |
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
| `APP_2FA_LOG_CODES` | Not used by current code | Omit |
| `SEMAPHORE_API_KEY` | Required only if SMS enabled | `<semaphore-api-key>` |
| `SEMAPHORE_SENDER_NAME` | Required only if SMS enabled | `<sender-name>` |
| `SEMAPHORE_BASE_URL` | Optional | `https://api.semaphore.co/api/v4/messages` |
| `INITIAL_ADMIN_EMAIL` | One-time bootstrap unless admin exists | `<admin-email>` |
| `INITIAL_ADMIN_PASSWORD` | One-time bootstrap unless admin exists | `<temporary-admin-password>` |
| `INITIAL_ADMIN_FULL_NAME` | One-time bootstrap unless admin exists | `<admin-name>` |
| `APP_SSO_ENABLED` | Optional when SSO profile active | `true` |
| `SSO_FRONTEND_SUCCESS_URI` | Required if SSO enabled | `https://<prod-frontend-origin>/` |
| `ENTRA_CLIENT_ID` | Required only for Entra SSO | `<entra-client-id>` |
| `ENTRA_CLIENT_SECRET` | Required only for Entra SSO | `<entra-client-secret>` |
| `ENTRA_TENANT_ID` | Required only for Entra SSO | `<tenant-id>` |
| `GOOGLE_CLIENT_ID` | Required only for Google SSO | `<google-client-id>` |
| `GOOGLE_CLIENT_SECRET` | Required only for Google SSO | `<google-client-secret>` |

Prod startup fails if:

- `JWT_SECRET` is blank, local/default, or contains `change_this`.
- `DB_URL` is blank, points to localhost/loopback, or a PostgreSQL URL without `sslmode=require`.
- `CORS_ALLOWED_ORIGINS` is blank, `*`, non-HTTPS, local, or malformed.
- Storage is not `azure-blob`.
- SQL logging is enabled.
- 2FA email code logging is enabled.

Dev and prod startup also fail if Blob Storage credentials or any required container name are missing or invalid.

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

## 6. Static Web App Routing

The current frontend uses relative backend paths and has no `VITE_API_BASE_URL` setting:

| Path | Backend purpose |
| --- | --- |
| `/api/**` | REST API, health, login, 2FA, users, organizations, events, registrations, payment-proof upload/download, attendance, and profile-picture upload |
| `/uploads/profile-pictures/**` | Public-by-URL profile images streamed by the backend from local storage or private Blob Storage |
| `/oauth2/**` | Spring Security SSO authorization entry points such as `/oauth2/authorization/entra` and `/oauth2/authorization/google` |
| `/login/oauth2/**` | SSO provider callback paths such as `/login/oauth2/code/entra` and `/login/oauth2/code/google` |

Local Vite proxies `/api`, `/uploads`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080` in `frontend/vite.config.ts`.

Auth and session assumptions:

- API calls use `Authorization: Bearer <jwt>` from frontend `localStorage`.
- Normal API auth does not depend on cookies.
- SSO, when enabled, uses a temporary backend session during the provider redirect, then redirects to `SSO_FRONTEND_SUCCESS_URI#sso_token=<jwt>`.
- Payment proofs stay under `/api/registrations/{id}/payment-proof` and remain JWT protected.
- Profile images are rendered directly with `<img src="/uploads/profile-pictures/<filename>">`.

Azure Static Web Apps API integration is practical for `/api/**`, but it does not cover this app's non-API backend paths. `staticwebapp.config.json` is still useful for SPA fallback and security headers, but it cannot replace a reverse proxy for arbitrary external App Service paths.

### Routing Options

Option A: Static Web App frontend + App Service backend + explicit backend base URL.

| Area | Impact |
| --- | --- |
| Code changes | Add a frontend base URL setting such as `VITE_API_BASE_URL`; prefix all API/download/upload requests; return or compose absolute profile-image URLs; change SSO buttons to the backend origin. |
| Azure changes | Static Web App and App Service only; backend App Service must be directly reachable. |
| SSO impact | Provider redirect URIs use the App Service origin, for example `https://<backend>.azurewebsites.net/login/oauth2/code/entra`; `SSO_FRONTEND_SUCCESS_URI` points back to the Static Web App. |
| CORS impact | Required. Set `CORS_ALLOWED_ORIGINS=https://<static-web-app>.azurestaticapps.net` plus any custom frontend domain. |
| Upload/profile image impact | Payment proofs work through explicit API URLs. Profile image URLs must become absolute backend URLs or be rewritten in frontend code. |
| Pros | Fewest Azure routing resources; straightforward to reason about. |
| Cons | Requires frontend code/config changes; browser sees a separate backend origin; profile-image URLs expose the backend origin; SSO and upload URLs must be audited carefully. |

Option B: Static Web App frontend + linked App Service API using `/api` only.

| Area | Impact |
| --- | --- |
| Code changes | None for existing `/api/**` calls, but current `/uploads/**`, `/oauth2/**`, and `/login/oauth2/**` paths are not covered. Making this work would require moving profile-image and SSO routes under `/api` or changing the frontend to another URL strategy. |
| Azure changes | Static Web App with linked App Service backend. |
| SSO impact | Breaks current SSO entry and callback paths if only `/api` is routed. |
| CORS impact | Minimal for `/api/**` because calls are same-origin through Static Web Apps. |
| Upload/profile image impact | Payment-proof upload/download works under `/api`; profile image rendering breaks because the frontend uses `/uploads/profile-pictures/**`. |
| Pros | Simple for pure `/api` applications. |
| Cons | Not viable for the current codebase as-is. |

Option C: Azure Front Door routes frontend and backend paths by URL path.

| Area | Impact |
| --- | --- |
| Code changes | None for the current frontend/backend path model. |
| Azure changes | Add Azure Front Door in front of the Static Web App and App Service. Route `/api/*`, `/uploads/*`, `/oauth2/*`, and `/login/oauth2/*` to App Service; route `/*` to Static Web Apps. |
| SSO impact | Provider redirect URIs can use the final Front Door origin, for example `https://<app-domain>/login/oauth2/code/entra`; set `SSO_FRONTEND_SUCCESS_URI=https://<app-domain>/`. Configure forwarded headers if Spring resolves redirects with the internal App Service host. |
| CORS impact | Browser calls are same-origin through Front Door. Set `CORS_ALLOWED_ORIGINS` to the final Front Door/custom HTTPS origin; add the direct Static Web App origin only if it will be used directly. |
| Upload/profile image impact | Works as-is. Payment proofs stay protected under `/api`; profile images stay at `/uploads/profile-pictures/**` and are streamed by the backend. |
| Pros | Safest no-code path for the current app; preserves relative URLs, SSO paths, and private Blob-backed uploads; avoids permanent SAS URLs. |
| Cons | Adds a routing resource and routing rules; requires correct origin host headers, health probes, and optional custom-domain/TLS setup. |

Option D: Host frontend and backend together under the App Service.

| Area | Impact |
| --- | --- |
| Code changes | Requires changing the build/deploy model so the Vite `dist` output is served by Spring Boot or by the App Service alongside the backend, with SPA fallback configured. |
| Azure changes | App Service can be the only web host; Static Web Apps becomes unnecessary. |
| SSO impact | Same-origin SSO paths work naturally. |
| CORS impact | Not needed for browser app calls when everything is same-origin. |
| Upload/profile image impact | Works with current paths once static frontend hosting is configured. |
| Pros | Simplest runtime routing shape. |
| Cons | Not aligned with the current GitHub Actions and Static Web Apps deployment plan; loses Static Web Apps hosting features; requires packaging and static-resource changes. |

### Routing Decision

Recommended dev strategy: use Option C with Azure Front Door if the dev environment must exercise the current frontend, profile images, uploads, and SSO without code changes.

Recommended prod strategy: use Option C with Azure Front Door or an equivalent path-aware reverse proxy. This keeps the browser-facing origin stable and avoids changing the application URL model before production.

Do not use Option B for the current deployment unless the app is changed so every backend route the browser needs is under `/api/**`.

Exact backend route rules for Option C:

| Path pattern | Origin |
| --- | --- |
| `/api/*` | Backend App Service |
| `/uploads/*` | Backend App Service |
| `/oauth2/*` | Backend App Service |
| `/login/oauth2/*` | Backend App Service |
| `/*` | Static Web Apps |

Exact frontend config changes for Option C: none.

Exact backend App Service settings for Option C:

```text
CORS_ALLOWED_ORIGINS=https://<front-door-or-custom-domain>
SSO_FRONTEND_SUCCESS_URI=https://<front-door-or-custom-domain>/
```

If Front Door or another reverse proxy is used for SSO and the generated provider redirect URI uses the internal App Service hostname instead of the public hostname, add:

```text
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

Current workflows use publish profiles, not OIDC.

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
- Backend: tests, packages JAR, deploys with `azure/webapps-deploy@v3`.
- Frontend: builds Vite app, deploys `frontend/dist` with `Azure/static-web-apps-deploy@v1`.

Required dev GitHub secrets:

| Secret | Status |
| --- | --- |
| `AZURE_WEBAPP_NAME_DEV` | Required |
| `AZURE_WEBAPP_PUBLISH_PROFILE_DEV` | Required for current workflow |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV` | Required |

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

- Not currently wired.
- To use OIDC, replace publish-profile deployment with `azure/login` and environment-scoped Azure client, tenant, subscription, and app identifiers.

Do not place database passwords, JWT secrets, Azure Storage keys, provider secrets, or App Service Application Settings in GitHub unless the workflow is explicitly changed to manage App Settings.

## 9. Dev Deployment Smoke Test

Backend smoke test:

- Confirm App Service starts with `SPRING_PROFILES_ACTIVE=dev`.
- Check App Service logs for successful Flyway migration.
- Call `GET https://<backend-origin>/api/health`.
- Create or bootstrap an admin.
- Log in through `POST /api/auth/login`.
- Call a JWT-protected endpoint such as `GET /api/me`.
- Verify CORS from the frontend origin.
- Upload a payment proof using JPG, PNG, or PDF under 10 MB.
- Download the payment proof as an event/main admin.
- Upload a profile picture.
- Verify blobs are created in `payment-proofs` and `profile-pictures`.
- Verify registration/user rows store stable references or `/uploads/profile-pictures/<filename>`, not machine-local paths or SAS URLs.

Frontend smoke test:

- Open the Static Web App URL.
- Confirm no browser network request goes to `localhost`.
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
- Static Web App dev exists and has routing for all backend paths.
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
