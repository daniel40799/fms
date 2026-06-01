# FAPOR7 Event Management System

Integrated Event Management System for the Federation of Accredited Professional Organizations of Region Seven Inc. (FAPOR7).

The project is intended to digitize the full event participation lifecycle: account registration, role-based administration, event setup, participant registration, payment validation, QR attendance, exhibitor engagement, evaluations, certificates, notifications, and reporting.

## Current Repository Gist

This repository currently contains:

- `backend/` - Java Spring Boot REST API with PostgreSQL, Flyway migrations, JWT authentication, Spring Security RBAC, and core event-management modules.
- `frontend/` - React + TypeScript + Vite application scaffold.
- `docker-compose.yml` - local PostgreSQL database for development.
- `docs/` - reserved for project documentation.
- `infra/` - reserved for deployment and infrastructure assets.

## Implemented Backend Modules

### Authentication and Security

- Email/password login through `POST /api/auth/login`.
- Optional login OTP 2FA for email/password login through email or SMS challenge records.
- JWT bearer tokens for stateless API authentication.
- BCrypt password encoding.
- Method-level role checks using Spring Security.
- Public health check through `GET /api/health`.

### User and Role Management

- User records with email, password hash, full name, status, organization, and roles.
- Role-based access control for:
  - `MAIN_ADMIN`
  - `USER_ADMIN`
  - `EVENT_ADMIN`
  - `ORGANIZATION_ADMIN`
  - `EXHIBITOR`
  - `END_USER`
- Current-user endpoint through `GET /api/me`.
- Self-service profile updates through `PATCH /api/me`.
- Administrative user listing, creation, and CSV import through `/api/users`.
- Organization administrators can maintain end-user organization affiliation within their organization scope.

### Organization Management

- Organization creation and listing through `/api/organizations`.
- Organizations can be linked to users and events for affiliation and reporting.

### Event Management

- Event creation, listing, lookup, update, and archive workflows through `/api/events`.
- Event fields include title, description, venue, schedule, capacity, registration window, status, owning organization, and creator.
- Event lifecycle statuses: `DRAFT`, `PUBLISHED`, and `ARCHIVED`.

### Registration and Manual Payment Review

- Participants register for events through `POST /api/registrations`.
- Users can view their own registrations through `GET /api/registrations/me`.
- Administrators can view all registrations.
- Participants upload proof of payment and a payment reference.
- Administrators approve registrations and store approval remarks.
- Approval generates a QR token used for attendance.

### QR Attendance

- Confirmed registrations can be checked in by QR token through `POST /api/attendance/check-in`.
- Attendance logs store registration, event, participant, scanning administrator, and timestamp.
- Duplicate check-ins for the same registration are prevented.

## Planned Scope From FAPOR7 Requirements

The broader system roadmap includes:

- Single Sign-On using Microsoft Entra ID or equivalent.
- Excel user import.
- Event resources, sub-events, parallel sessions, ticket limits, and external registration forms.
- Online payment gateway integration such as Maya Checkout, including webhook confirmation.
- Azure Blob Storage for event resources and generated certificates.
- Exhibitor QR scanning and participant-exhibitor interaction reports.
- Evaluation and assessment completion tracking using external forms.
- Digital certificate generation from eligibility criteria.
- Email and SMS notification workflows.
- Administrative dashboards, exportable reports, audit logs, monitoring, and analytics.
- Azure deployment using services such as Static Web Apps, App Service, Azure SQL, Blob Storage, and Azure monitoring tools.

## Backend Tech Stack

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Security
- Spring Data JPA
- Flyway
- PostgreSQL
- JWT with `jjwt`
- Maven wrapper

## Frontend Tech Stack

- React 19
- TypeScript
- Vite
- React Router
- TanStack Query
- Axios
- Tailwind CSS

## How to Run Locally

### Prerequisites

- Java 21
- Node.js and npm
- Docker Desktop or a local PostgreSQL instance

### Start the Database

```powershell
docker compose up -d postgres
```

The local database defaults are:

- Database: `fms_dev`
- Username: `fms`
- Password: `fmspass`
- Port: `5432`

If you use a local PostgreSQL installation instead of Docker Compose, create the same database/user or set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` before starting the backend.

### Run the Backend

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The Maven wrapper defaults `spring-boot:run` to the `local` profile through `backend/.mvn/maven.config`.
The `local` profile uses a committed dummy JWT secret named `local-development-jwt-secret-change-before-nonlocal-use`; it is only for local development and is rejected by the `dev` and `prod` profiles.
If you override the local profile, set `JWT_SECRET` manually or startup will fail with `JWT_SECRET must be configured`.
Local uploads use filesystem storage under `backend/uploads` by default, not Azure Blob Storage.

Expected backend URL: `http://localhost:8080`.

### Run the Frontend

```powershell
cd frontend
npm ci
npm run dev
```

Expected frontend URL: `http://localhost:5173`.

Leave `VITE_API_BASE_URL` blank or unset for local development. The frontend keeps using relative `/api/*`, `/uploads/*`, `/oauth2/*`, and `/login/oauth2/*` paths, and the Vite proxy in `frontend/vite.config.ts` forwards them to `http://localhost:8080`.

Common local startup errors:

- `Connection to localhost:5432 refused` means local PostgreSQL is not running. Start it with `docker compose up -d postgres` or start your local PostgreSQL service.
- `JWT_SECRET must be configured` means the active backend profile does not have the local dummy JWT secret and you need to set `JWT_SECRET`.

## Environment Routing Summary

| Environment | Frontend behavior | Backend routing |
| --- | --- | --- |
| Local | Relative `/api/*`, `/uploads/*`, `/oauth2/*`, and `/login/oauth2/*`; `VITE_API_BASE_URL` blank/unset | Vite proxy forwards to `http://localhost:8080` |
| Dev | Static Web App uses `VITE_API_BASE_URL` set to the backend App Service origin | Browser calls App Service directly; backend CORS must allow the SWA origin |
| Prod | Relative same-origin paths; `VITE_API_BASE_URL` blank/unset | Front Door/custom domain later routes backend-owned paths to App Service |

## Important API Flow

1. Administrator logs in and receives a JWT.
2. Administrator creates organizations and users with roles.
3. Event administrator creates an event.
4. End user registers for the event.
5. End user uploads proof of payment.
6. Event administrator approves the registration.
7. System generates a QR token for the registration.
8. Event administrator scans the QR token to create an attendance log.
9. Attendance, registration, payment, and event data can be used for reporting and future certificate generation.

## Configuration

Backend configuration is split across:

- `backend/src/main/resources/application.yml` for shared safe defaults
- `backend/src/main/resources/application-local.yml`
- `backend/src/main/resources/application-dev.yml`
- `backend/src/main/resources/application-prod.yml`

Select profiles with `SPRING_PROFILES_ACTIVE=local`, `SPRING_PROFILES_ACTIVE=dev`, or `SPRING_PROFILES_ACTIVE=prod`.
When running the backend through `.\mvnw.cmd spring-boot:run`, `local` is selected automatically unless you override `-Dspring-boot.run.profiles`.

Standard environment variables include `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`, and `APP_UPLOAD_BASE_PATH`.
Local development can omit `JWT_SECRET`; Azure `dev` and `prod` must set a strong non-default `JWT_SECRET` in App Service settings.
`APP_STORAGE_TYPE=local` uses filesystem storage. For Azure dev/prod uploads, set `APP_STORAGE_TYPE=azure-blob`, `AZURE_STORAGE_CONNECTION_STRING` or account/key credentials, and the four `AZURE_STORAGE_CONTAINER_*` settings documented below.
See `docs/azure-environments.md` for Azure setup, GitHub Actions secrets, and production constraints.

### Local Password 2FA

App-side OTP 2FA applies to local email/password login only. Microsoft Entra ID and Google SSO continue to issue the existing FAPOR7 JWT after provider authentication and rely on provider-side MFA or conditional access.

When email or SMS 2FA is required, `POST /api/auth/login` returns a 2FA challenge response and does not return a JWT. The JWT is issued only after `POST /api/auth/2fa/verify` succeeds. `POST /api/auth/2fa/resend` reuses the same challenge record and enforces the configured cooldown and attempt limits.
The frontend local login form lets users choose Email or SMS verification. Email uses the backend's default email-first behavior, and SMS sends `channel: "SMS"` on the login request.

Local development can log email OTP codes when both `APP_2FA_EMAIL_ENABLED=true` and `APP_2FA_EMAIL_LOG_CODES=true`. Shared dev and prod should use a real sender and keep code logging disabled.

2FA delivery settings:

| Setting | Purpose |
| --- | --- |
| `APP_2FA_EMAIL_ENABLED` | Enables email OTP challenges for local password login |
| `APP_2FA_EMAIL_LOG_CODES` | Logs email OTP codes for local development only |
| `ACS_EMAIL_ENABLED` | Uses Azure Communication Services Email for email OTP delivery |
| `ACS_EMAIL_CONNECTION_STRING` | ACS Email connection string, supplied through environment/App Service settings |
| `ACS_EMAIL_SENDER_ADDRESS` | Verified ACS sender address |
| `ACS_EMAIL_SUBJECT` | Optional email subject override |
| `APP_2FA_SMS_ENABLED` | Enables SMS OTP challenges when requested by the login request |
| `SEMAPHORE_API_KEY` | Semaphore API key, supplied through environment/App Service settings |
| `SEMAPHORE_SENDER_NAME` | Semaphore sender name |
| `SEMAPHORE_BASE_URL` | Optional Semaphore API URL override |
| `APP_2FA_CODE_LENGTH` | OTP digit length |
| `APP_2FA_EXPIRY_MINUTES` | OTP expiry window |
| `APP_2FA_RESEND_COOLDOWN_SECONDS` | Minimum resend interval |
| `APP_2FA_MAX_FAILED_ATTEMPTS` | Failed verification attempt limit |
| `APP_2FA_MAX_CHALLENGES_PER_HOUR` | Challenge creation rate limit |

Email 2FA environment variables bind to these backend properties:

| Environment variable | Spring property |
| --- | --- |
| `APP_2FA_EMAIL_ENABLED` | `app.two-factor.email.enabled` |
| `APP_2FA_EMAIL_LOG_CODES` | `app.two-factor.email.log-codes` |
| `ACS_EMAIL_ENABLED` | `app.two-factor.email.acs.enabled` |
| `ACS_EMAIL_CONNECTION_STRING` | `app.two-factor.email.acs.connection-string` |
| `ACS_EMAIL_SENDER_ADDRESS` | `app.two-factor.email.acs.sender-address` |
| `ACS_EMAIL_SUBJECT` | `app.two-factor.email.acs.subject` |

Backend startup logs include `Email 2FA startup diagnostics` with active profiles, effective 2FA/ACS flags, whether the ACS connection string is present, sender address, and subject. ACS send failures log `ACS Email 2FA send failed` with the exception class, safe message, and Azure status/error code when available. The ACS connection string, access keys, and OTP code are not logged by the ACS sender.

Do not commit real ACS, Semaphore, JWT, database, or storage secrets. Supply them through local environment variables or Azure App Service Application Settings.

### Upload Storage

Local development stores uploads on the filesystem under `APP_UPLOAD_BASE_PATH`.

Azure `dev` and `prod` store uploaded payment proofs and profile pictures in private Azure Blob containers. Payment proofs are streamed through the authenticated registration payment-proof endpoint. Profile pictures keep the existing `/uploads/profile-pictures/<filename>` URL and are streamed by the backend; no SAS URLs are stored in the database.

Required Azure App Settings:

- `AZURE_STORAGE_CONNECTION_STRING`
- `AZURE_STORAGE_CONTAINER_PAYMENT_PROOFS=payment-proofs`
- `AZURE_STORAGE_CONTAINER_PROFILE_PICTURES=profile-pictures`
- `AZURE_STORAGE_CONTAINER_EVENT_RESOURCES=event-resources`
- `AZURE_STORAGE_CONTAINER_CERTIFICATES=certificates`

Payment proof uploads default to a 10 MB maximum and accept JPG, PNG, or PDF files only. Override with `APP_PAYMENT_PROOF_MAX_SIZE_BYTES`, `APP_PAYMENT_PROOF_ALLOWED_CONTENT_TYPES`, and `APP_PAYMENT_PROOF_ALLOWED_EXTENSIONS` if needed.

## Database Migrations

Flyway migrations live in `backend/src/main/resources/db/migration`.

Current migrations initialize:

- Users
- Roles and organizations
- Seed admin user
- Events
- Registrations
- Registration payment fields
- Registration QR fields
- Attendance logs

### Local/Dev Seeded RBAC Test Users

Old Flyway seed history is preserved, but unsafe seed rows are cleaned up by a forward-only migration and recreated only by the local/dev seeder when enabled. The default local seed password is `local-dev-only-password` unless `APP_DEV_SEED_PASSWORD` is set.

| Role | Email |
| --- | --- |
| Main Administrator | `daniel@fapor7.org` |
| User Administrator | `user.admin@fapor7.org` |
| Event Administrator | `event.admin@fapor7.org` |
| Organization Administrator | `organization.admin@fapor7.org` |
| Exhibitor | `exhibitor@fapor7.org` |
| End User | `end.user@fapor7.org` |

## Bulk User CSV Import

Main and user administrators can import CSV files from the Users page or through `POST /api/users/import`.
The CSV template is in `docs/user-import-template.csv`.

Required columns:

- `fullName`
- `email`
- `password`

Optional columns:

- `organizationCode` - short organization code stored in the system
- `roles` - role names separated by `|` or `;`; blank values default to `END_USER`

## Documentation Notes

Backend Java classes now include Javadocs that summarize each module, public controller/service/repository method, request DTO, response DTO, and domain entity. The Javadocs are written to give a quick project gist while still documenting parameters, return values, and important business rules.
