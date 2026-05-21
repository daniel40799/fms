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
- Azure Blob Storage for payment proof, resources, and generated certificates.
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

Backend configuration lives in `backend/src/main/resources/application.yml`.

Key values:

- `spring.datasource.url`
- `spring.datasource.username`
- `spring.datasource.password`
- `server.port`
- `app.jwt.secret`
- `app.jwt.expiration-ms`

For production, replace the default JWT secret and database credentials with secure environment-specific values.

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

### Seeded RBAC Test Users

The database migrations seed one FAPOR7 account for each RBAC role. The role-specific accounts below copy the stored password hash from the seeded main administrator, so sign in with the same password used for `daniel@fapor7.org`.

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
