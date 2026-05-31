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

## Local Development

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

### Run the Backend

```powershell
cd backend
$env:SPRING_PROFILES_ACTIVE='local'
.\mvnw.cmd spring-boot:run
```

The API runs on `http://localhost:8080`.

### Run the Frontend

```powershell
cd frontend
npm install
npm run dev
```

The Vite development server prints the local frontend URL after startup.

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

Standard environment variables include `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`, and `APP_UPLOAD_BASE_PATH`.
For Azure dev/prod uploads, set `APP_STORAGE_TYPE=azure-blob`, `AZURE_STORAGE_CONNECTION_STRING`, and the four `AZURE_STORAGE_CONTAINER_*` settings documented below.
See `docs/azure-environments.md` for Azure setup, GitHub Actions secrets, and production constraints.

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
