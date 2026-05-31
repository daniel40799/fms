# FAPOR7/FMS Azure Dev Setup Checklist

This checklist prepares the dev environment only. It does not deploy from this repository and does not contain real secrets.

Dev intentionally avoids Azure Front Door cost. The Static Web App calls the backend App Service directly through `VITE_API_BASE_URL`. Production can add Front Door or an equivalent custom-domain reverse proxy later while keeping frontend backend paths relative.

Current dev origins:

| Role | Origin |
| --- | --- |
| Frontend SWA | `https://thankful-ground-077ba4800.7.azurestaticapps.net` |
| Backend App Service | `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` |

## Current Repo Requirements

- Backend runtime profile: `SPRING_PROFILES_ACTIVE=dev`.
- Backend storage type: `app.storage.type=azure-blob`, configured by `APP_STORAGE_TYPE=azure-blob` for clarity. `local` means filesystem storage; `azure-blob` means Azure Blob Storage.
- Backend JWT secret: `JWT_SECRET` must be a strong non-default value. The committed local-only dummy secret is rejected by the `dev` profile.
- Frontend supports optional `VITE_API_BASE_URL`.
- Local and prod builds leave `VITE_API_BASE_URL` blank/unset and keep relative backend paths.
- Dev frontend builds set `VITE_API_BASE_URL` to the backend App Service origin.
- Local Vite proxies `/api`, `/uploads`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080`.
- Dev deployment workflow is `.github/workflows/azure-dev.yml`.
- The dev workflow deploys from `develop`; manual dispatch is blocked unless the selected ref is `develop`.
- The dev backend workflow uses Azure OIDC. The frontend workflow uses a Static Web Apps deployment token.
- The dev workflow does not use `AZURE_WEBAPP_PUBLISH_PROFILE_DEV`.
- No `staticwebapp.config.json` is currently present.

## Dev Setup Order

1. Resource group
   - Create or identify the dev resource group. The shared dev deployment target is `rg-fms-dev`.
   - Verify the Azure region is acceptable for App Service, PostgreSQL, Storage, and Static Web Apps.

2. Azure PostgreSQL Flexible Server
   - Create a dev PostgreSQL Flexible Server.
   - Create the dev database, for example `fms_dev`.
   - Configure network access from App Service using approved firewall rules, VNet integration, or private endpoint.
   - Use a JDBC URL with `sslmode=require`.
   - Verify the username format required by the server.

3. Azure App Service backend
   - Create a Linux App Service Plan and Web App for the Spring Boot backend.
   - Use Java 21.
   - Configure the Application Settings listed below before first startup.
   - Set `CORS_ALLOWED_ORIGINS=https://thankful-ground-077ba4800.7.azurestaticapps.net`.
   - Do not put database passwords, JWT secrets, storage connection strings, or provider secrets in source control.

4. Azure Blob Storage
   - Create a dev Storage Account.
   - Disable public blob access at the account level when possible.
   - Create private containers:
     - `payment-proofs`
     - `profile-pictures`
     - `event-resources`
     - `certificates`
   - Use a connection string in App Service settings for the current implementation.

5. Azure Static Web App frontend
   - Create or use the dev Static Web App at `https://thankful-ground-077ba4800.7.azurestaticapps.net`.
   - The current GitHub workflow uploads the already-built `frontend/dist` directory.
   - Capture the Static Web Apps deployment token for the GitHub secret.
   - Optional before production: add `staticwebapp.config.json` for SPA fallback and security headers. It is not a substitute for Front Door/custom-domain routing.

6. Azure OIDC deployment identity
   - Create an app registration named `github-fms-dev-deploy`.
   - Add a federated credential for the `develop` branch with subject `repo:daniel40799/fms:ref:refs/heads/develop`.
   - Assign the service principal `Contributor` on resource group `rg-fms-dev`.
   - Capture the app client ID, tenant ID, and subscription ID for GitHub Environment secrets.

7. GitHub Environment: `dev`
   - Add the required dev workflow secrets listed below.
   - Add `VITE_API_BASE_URL_DEV=https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` as a GitHub Environment variable.
   - Confirm `.github/workflows/azure-dev.yml` uses `environment: dev` for jobs that need dev environment secrets or variables.
   - Optional: add reviewers or deployment rules for the dev environment.

8. First dev deployment
   - Push the intended code to `develop`, or run manual dispatch from `develop`.
   - Confirm backend test, package, and App Service deployment steps pass.
   - Confirm frontend install, build, and Static Web Apps deployment steps pass.

9. Dev smoke test
   - Use the Static Web App URL as the browser entry point.
   - Run the smoke test checklist at the end of this document.

## Azure App Service Dev Settings

Set these on the backend App Service as Application Settings. Values below are placeholders only unless an exact dev URL is shown.

Required:

| Setting | Value |
| --- | --- |
| `SPRING_PROFILES_ACTIVE` | `dev` |
| `DB_URL` | `jdbc:postgresql://<postgres-server-name>.postgres.database.azure.com:5432/<database>?sslmode=require` |
| `DB_USERNAME` | `<db-username>` |
| `DB_PASSWORD` | `<db-password>` |
| `JWT_SECRET` | `<strong-random-secret-not-the-local-default>` |
| `JWT_EXPIRATION_MS` | `86400000` |
| `CORS_ALLOWED_ORIGINS` | `https://thankful-ground-077ba4800.7.azurestaticapps.net` |
| `APP_STORAGE_TYPE` | `azure-blob` |
| `AZURE_STORAGE_CONNECTION_STRING` | `<storage-connection-string>` |
| `AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS` | `payment-proofs` |
| `AZURE_STORAGE_CONTAINER_PROFILE_PICTURES` | `profile-pictures` |
| `AZURE_STORAGE_CONTAINER_EVENT_RESOURCES` | `event-resources` |
| `AZURE_STORAGE_CONTAINER_CERTIFICATES` | `certificates` |
| `APP_PAYMENT_PROOF_MAX_SIZE_BYTES` | `10485760` |
| `APP_PAYMENT_PROOF_ALLOWED_CONTENT_TYPES` | `image/jpeg,image/png,application/pdf` |
| `APP_PAYMENT_PROOF_ALLOWED_EXTENSIONS` | `jpg,jpeg,png,pdf` |

Optional/dev:

| Setting | Use |
| --- | --- |
| `SERVER_FORWARD_HEADERS_STRATEGY` | Not required for direct App Service dev; use `framework` later behind Front Door/custom-domain routing |
| `INITIAL_ADMIN_EMAIL` | One-time admin bootstrap if no main admin exists |
| `INITIAL_ADMIN_PASSWORD` | One-time admin bootstrap password |
| `INITIAL_ADMIN_FULL_NAME` | One-time admin bootstrap full name |
| `APP_DEV_SEED_ENABLED` | Optional dev seed data, usually `false` for shared dev |
| `APP_DEV_SEED_PASSWORD` | Required only when dev seed is enabled |
| `APP_2FA_EMAIL_ENABLED` | Enable email 2FA only after email delivery is configured |
| `APP_2FA_EMAIL_LOG_CODES` | Dev debugging only; keep `false` for shared dev |
| `APP_2FA_SMS_ENABLED` | Enable SMS 2FA only after Semaphore settings are configured |
| `SEMAPHORE_API_KEY` | Required only if SMS 2FA is enabled |
| `SEMAPHORE_SENDER_NAME` | Required only if SMS 2FA is enabled |
| `SEMAPHORE_BASE_URL` | Optional Semaphore override |
| `APP_SSO_ENABLED` | Required only when SSO profiles are active |
| `SSO_FRONTEND_SUCCESS_URI` | Required if SSO is enabled: `https://thankful-ground-077ba4800.7.azurestaticapps.net/` |
| `ENTRA_CLIENT_ID` | Required only for Entra SSO |
| `ENTRA_CLIENT_SECRET` | Required only for Entra SSO |
| `ENTRA_TENANT_ID` | Required only for Entra SSO |
| `GOOGLE_CLIENT_ID` | Required only for Google SSO |
| `GOOGLE_CLIENT_SECRET` | Required only for Google SSO |

## Frontend Backend URL Behavior

| Environment | Frontend origin | `VITE_API_BASE_URL` | Backend path behavior |
| --- | --- | --- | --- |
| Local | `http://localhost:5173` | Blank/unset | Relative paths are proxied by Vite to `http://localhost:8080` |
| Dev | `https://thankful-ground-077ba4800.7.azurestaticapps.net` | `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` | Browser calls App Service directly |
| Prod | Front Door/custom domain | Blank/unset | Relative paths stay same-origin and are routed by Front Door/custom domain |

The frontend prefixes only backend-owned paths when `VITE_API_BASE_URL` is set:

- `/api/*`
- `/uploads/*`
- `/oauth2/*`
- `/login/oauth2/*`

Do not hardcode production URLs in the frontend. Production should keep `VITE_API_BASE_URL` blank/unset.

## Future Prod Front Door Routing Plan

Front Door is reserved for prod or a later prod-like rehearsal.

Routes:

| Route | Patterns | Origin group | Notes |
| --- | --- | --- | --- |
| Backend API | `/api/*` | Backend App Service | REST API, health, uploads under `/api`, payment proof download |
| Backend uploads | `/uploads/*` | Backend App Service | Profile images streamed by backend |
| Backend SSO authorize | `/oauth2/*` | Backend App Service | Provider authorization entry points |
| Backend SSO callback | `/login/oauth2/*` | Backend App Service | OAuth2 callback endpoints |
| Frontend catch-all | `/*` | Static Web App | SPA assets and client-side routes |

Prod backend settings behind Front Door/custom-domain routing:

```text
CORS_ALLOWED_ORIGINS=https://<front-door-or-custom-domain>
SSO_FRONTEND_SUCCESS_URI=https://<front-door-or-custom-domain>/
SERVER_FORWARD_HEADERS_STRATEGY=framework
```

## GitHub Dev Secrets And Variables

The dev workflow requires these GitHub secrets in the `dev` Environment:

| Secret | Source |
| --- | --- |
| `AZURE_CLIENT_ID_DEV` | Application/client ID for app registration `github-fms-dev-deploy` |
| `AZURE_TENANT_ID_DEV` | Azure tenant ID containing the app registration |
| `AZURE_SUBSCRIPTION_ID_DEV` | Azure subscription ID containing `rg-fms-dev` |
| `AZURE_WEBAPP_NAME_DEV` | Backend App Service name |
| `AZURE_STATIC_WEB_APPS_API_TOKEN_DEV` | Static Web Apps deployment token |

The dev workflow requires this GitHub variable in the `dev` Environment:

| Variable | Value |
| --- | --- |
| `VITE_API_BASE_URL_DEV` | `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net` |

Required Azure OIDC setup:

| Azure item | Required value |
| --- | --- |
| App registration display name | `github-fms-dev-deploy` |
| Federated credential subject | `repo:daniel40799/fms:ref:refs/heads/develop` |
| Federated credential issuer | `https://token.actions.githubusercontent.com` |
| Federated credential audience | `api://AzureADTokenExchange` |
| Role assignment | `Contributor` on `rg-fms-dev` |

Workflow behavior:

- Pushes to `develop` deploy dev.
- Manual `workflow_dispatch` is available, but the guard job fails unless the selected ref is `refs/heads/develop`.
- Backend job runs Maven tests, packages the JAR, signs in with `azure/login@v2`, and deploys with `azure/webapps-deploy@v3`.
- Frontend job runs `npm ci`, validates `VITE_API_BASE_URL_DEV`, runs `npm run build` with `VITE_API_BASE_URL=${{ vars.VITE_API_BASE_URL_DEV }}`, and deploys `frontend/dist` with `Azure/static-web-apps-deploy@v1`.
- `AZURE_WEBAPP_PUBLISH_PROFILE_DEV` is no longer used by the dev workflow.

## Dev Smoke Test Checklist

Backend:

- App Service starts.
- Logs show the `dev` profile.
- Flyway migrations complete successfully.
- Database connection works.
- Blob Storage environment validation passes.
- `GET https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/api/health` returns healthy status.
- Initial admin or dev admin can log in.
- `GET https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/api/me` works with a JWT.
- CORS allows `https://thankful-ground-077ba4800.7.azurestaticapps.net`.
- Payment proof upload accepts JPG, PNG, or PDF under 10 MB.
- Payment proof upload writes a blob to `payment-proofs`.
- Payment proof download works for `MAIN_ADMIN` or `EVENT_ADMIN`.
- Profile image upload writes a blob to `profile-pictures`.
- Profile image URL loads through `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/uploads/profile-pictures/<filename>`.

Frontend:

- Static Web App loads at `https://thankful-ground-077ba4800.7.azurestaticapps.net`.
- Login works through the frontend.
- Browser Network tab shows no `localhost` requests.
- `/api` requests hit `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net`.
- `/uploads` requests hit `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net`.
- Payment proof upload works from the UI.
- Profile image upload and display work from the UI.
- Refreshing a nested frontend route does not break SPA navigation.

SSO, if enabled:

- `/oauth2/authorization/entra` or `/oauth2/authorization/google` opens on the backend App Service origin.
- Provider callback returns to `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/login/oauth2/code/<provider>`.
- Success redirect returns to `https://thankful-ground-077ba4800.7.azurestaticapps.net/#sso_token=<jwt>`.
- The frontend stores the JWT and loads the authenticated session.

GitHub Actions:

- Dev workflow runs from `develop`.
- Backend deploy succeeds.
- Frontend deploy succeeds.
- Manual dispatch from a non-`develop` ref fails at the guard job.

## Open Questions Before Manual Dev Configuration

- Will PostgreSQL use public firewall rules, VNet integration, or private endpoint?
- Will SSO be enabled in dev immediately, or after the basic JWT login flow is verified?
- Will shared dev use `INITIAL_ADMIN_*`, `APP_DEV_SEED_ENABLED`, or both?
- Will 2FA email/SMS be enabled in dev, and which delivery providers/settings will be used?
