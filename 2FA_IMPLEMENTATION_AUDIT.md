# 2FA Implementation Audit

Audit date: 2026-06-01

Scope: local repository inspection only. No source implementation changes were made.

Post-implementation note: this report captures the pre-implementation audit state. The follow-up local-password 2FA implementation added ACS Email delivery, SMS/Semaphore wiring, structured auth errors, and frontend channel selection. Treat the current backend/frontend code and README as the source of truth for runtime behavior.

## 1. Executive Summary

The repository already contains a partial login 2FA implementation. It is centered on the `two_factor_verifications` table and the backend `TwoFactorService`, which creates one-time login challenges, stores BCrypt-hashed codes, enforces expiry, tracks failed attempts, supports resend cooldowns, and issues the normal JWT only after successful verification.

Current effective support is email-code login 2FA only. In the `local` profile, email 2FA is enabled by default and codes are logged through `LoggingEmailCodeSender`. In base/dev/prod configuration, email 2FA is disabled by default. If email 2FA is enabled outside local today, there is no real email delivery integration, so users will not receive a code unless logging is enabled.

SMS is scaffolded but not wired into 2FA. The code has an `SMS` enum value, a `SmsSender` abstraction, a `SemaphoreSmsSender`, and Semaphore configuration, but `TwoFactorService` never injects or calls `SmsSender`, and no login path chooses SMS. Authenticator-app/TOTP support does not exist.

Microsoft Entra ID and Google SSO bypass 2FA and immediately receive the app JWT after successful provider authentication and local user mapping/provisioning. They share JWT issuance through `JwtService`, but not the local password 2FA challenge path.

The frontend already expects a two-step login response and has a verification-code UI for `EMAIL` or `SMS`, but the backend currently returns only `EMAIL` challenges.

## 2. Existing Auth Flows

### Local Username/Password Login

Files:

- `backend/src/main/java/com/fapor7/fms/auth/AuthController.java`
- `backend/src/main/java/com/fapor7/fms/auth/AuthService.java`
- `backend/src/main/java/com/fapor7/fms/auth/TwoFactorService.java`
- `backend/src/main/java/com/fapor7/fms/auth/LoginRequest.java`
- `backend/src/main/java/com/fapor7/fms/auth/LoginResponse.java`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/lib/api.ts`

Current flow:

1. Frontend posts `POST /api/auth/login` with `{ email, password }`.
2. `AuthService.login` looks up the user by exact email using `UserRepository.findByEmail`.
3. The service rejects inactive accounts.
4. The service verifies the password using `PasswordEncoder.matches`.
5. If `TwoFactorService.isEmailEnabled()` is true, it calls `TwoFactorService.startEmailChallenge(user)` and returns a challenge response with `token = null` and `twoFactorRequired = true`.
6. If email 2FA is disabled, it immediately calls `JwtService.generateToken(user.getId(), user.getEmail())` and returns `new LoginResponse(token)`.
7. The frontend either stores the returned token or switches to the verification-code UI.
8. The frontend posts `POST /api/auth/2fa/verify` with `{ challengeId, code }`.
9. `AuthService.verifyTwoFactor` verifies and consumes the challenge, then issues the JWT.

2FA behavior:

- Uses 2FA only when `app.two-factor.email.enabled` is true.
- In `application-local.yml`, `APP_2FA_EMAIL_ENABLED` defaults to `true`.
- In `application.yml`, `application-dev.yml`, and `application-prod.yml`, `APP_2FA_EMAIL_ENABLED` defaults to `false`.
- Does not support SMS selection in the login flow today.
- Does not issue a JWT before email OTP verification when email 2FA is enabled.

### Microsoft Entra ID SSO

Files:

- `backend/src/main/resources/application-sso.yml`
- `backend/src/main/resources/application-sso-entra.yml`
- `backend/src/main/java/com/fapor7/fms/config/SecurityConfig.java`
- `backend/src/main/java/com/fapor7/fms/auth/SsoAuthenticationSuccessHandler.java`
- `backend/src/main/java/com/fapor7/fms/auth/AuthService.java`
- `docs/sso-setup.md`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/App.tsx`

Current flow:

1. Frontend navigates to `/oauth2/authorization/entra`.
2. Spring Security starts the OAuth/OIDC flow when the `sso` and `sso-entra` profiles are active and `app.sso.enabled` is true.
3. Entra redirects back to `/login/oauth2/code/entra`.
4. `SsoAuthenticationSuccessHandler` receives the authenticated `OAuth2AuthenticationToken`.
5. The handler calls `AuthService.loginSso(oauthToken.getPrincipal())`.
6. `AuthService.loginSso` reads the first nonblank email-like claim from `email`, `preferred_username`, then `upn`.
7. Existing users are matched by case-insensitive email. Missing users are provisioned as active `END_USER` accounts with an unguessable placeholder password.
8. Inactive users are rejected.
9. `AuthService.loginSso` immediately returns a JWT through `JwtService`.
10. The success handler redirects to `SSO_FRONTEND_SUCCESS_URI#sso_token=<jwt>`.
11. `frontend/src/App.tsx` reads `sso_token` from the URL fragment and stores it in the same token store used by password login.

2FA behavior:

- 2FA is not involved.
- No challenge is created.
- No OTP is sent.
- JWT issuance is immediate after provider authentication and local user status checks.
- This appears to be the current code design, although there is no explicit policy comment saying "SSO intentionally skips app 2FA".

### Google SSO

Files:

- `backend/src/main/resources/application-sso.yml`
- `backend/src/main/resources/application-sso-google.yml`
- `backend/src/main/java/com/fapor7/fms/config/SecurityConfig.java`
- `backend/src/main/java/com/fapor7/fms/auth/SsoAuthenticationSuccessHandler.java`
- `backend/src/main/java/com/fapor7/fms/auth/AuthService.java`
- `docs/sso-setup.md`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/App.tsx`

Current flow:

1. Frontend navigates to `/oauth2/authorization/google`.
2. Spring Security starts the OAuth/OIDC flow when the `sso` and `sso-google` profiles are active and `app.sso.enabled` is true.
3. Google redirects back to `/login/oauth2/code/google`.
4. The same `SsoAuthenticationSuccessHandler` and `AuthService.loginSso` path is used.
5. The app returns `SSO_FRONTEND_SUCCESS_URI#sso_token=<jwt>`.

2FA behavior:

- Same as Entra: app 2FA is bypassed.
- No OTP challenge is created.
- JWT issuance is immediate after provider authentication and local user status checks.

## 3. Existing 2FA Data Model

### `two_factor_verifications` table

File:

- `backend/src/main/resources/db/migration/V14__organization_holders_memberships_2fa.sql`

Important fields:

| Field | Purpose |
| --- | --- |
| `id UUID PRIMARY KEY` | Client-visible challenge identifier. |
| `user_id UUID NOT NULL` | User who completed the first login factor. |
| `channel VARCHAR(20) NOT NULL` | Delivery channel, currently represented by `EMAIL` or `SMS`. |
| `destination VARCHAR(255) NOT NULL` | Email address or mobile number the code was sent to. |
| `code_hash VARCHAR(255) NOT NULL` | BCrypt-hashed OTP. Raw codes are not stored. |
| `status VARCHAR(50) NOT NULL` | Lifecycle value: `PENDING`, `VERIFIED`, or `EXPIRED`. |
| `failed_attempt_count INTEGER NOT NULL DEFAULT 0` | Counts failed verification attempts. |
| `resend_count INTEGER NOT NULL DEFAULT 0` | Counts resends, but no max resend limit currently uses it. |
| `expires_at TIMESTAMP NOT NULL` | Challenge expiry. |
| `verified_at TIMESTAMP` | Set when code is correct. |
| `consumed_at TIMESTAMP` | Set when code is used. |
| `last_sent_at TIMESTAMP NOT NULL` | Used for resend cooldown. |
| `created_at`, `updated_at` | Audit timestamps. |

Likely purpose:

- This is a login OTP challenge table.
- It is not currently used for email ownership verification or mobile ownership verification.
- The entity and repository comments explicitly describe login 2FA and login verification challenges.

Active usage:

- Actively used by `TwoFactorService` for email login 2FA when `app.two-factor.email.enabled` is true.
- The `SMS` channel exists in the model but is not actively used by login challenge creation.

### `TwoFactorVerificationEntity`

File:

- `backend/src/main/java/com/fapor7/fms/auth/TwoFactorVerificationEntity.java`

Important fields:

- `id`
- `user`
- `channel`
- `destination`
- `codeHash`
- `status`
- `failedAttemptCount`
- `resendCount`
- `expiresAt`
- `verifiedAt`
- `consumedAt`
- `lastSentAt`
- `createdAt`
- `updatedAt`

Likely purpose:

- JPA mapping for stored one-time login verification challenges.

Active usage:

- Actively used by `TwoFactorService`.

### `TwoFactorChannel`

File:

- `backend/src/main/java/com/fapor7/fms/auth/TwoFactorChannel.java`

Values:

- `EMAIL`
- `SMS`

Likely purpose:

- Delivery-channel framework for 2FA codes.

Active usage:

- `EMAIL` is actively used.
- `SMS` is scaffolded but not used by the 2FA service.

### `TwoFactorStatus`

File:

- `backend/src/main/java/com/fapor7/fms/auth/TwoFactorStatus.java`

Values:

- `PENDING`
- `VERIFIED`
- `EXPIRED`

Likely purpose:

- Challenge lifecycle.

Active usage:

- Actively used by `TwoFactorService` and `TwoFactorVerificationRepository`.
- There is no `LOCKED`, `FAILED`, or `CANCELLED` status for max-attempt exhaustion.

### `TwoFactorVerificationRepository`

File:

- `backend/src/main/java/com/fapor7/fms/auth/TwoFactorVerificationRepository.java`

Methods:

- `findFirstByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, TwoFactorStatus status)`
- `countByUserIdAndCreatedAtAfter(UUID userId, LocalDateTime createdAfter)`

Likely purpose:

- Load active challenges and rate-limit challenge creation.

Active usage:

- Actively used by `TwoFactorService`.

### Supporting `users` fields

Files:

- `backend/src/main/java/com/fapor7/fms/users/UserEntity.java`
- `backend/src/main/resources/db/migration/V1__init_users.sql`
- `backend/src/main/resources/db/migration/V11__event_posters_price_and_profile_fields.sql`

Relevant fields:

- `email`
- `password_hash`
- `status`
- `mobile_number`

Likely purpose:

- `email` is the login identifier and current email OTP destination.
- `mobile_number` is captured on registration/profile updates and is documented in `RegisterRequest` as "used for future SMS verification", but it is not currently verified and not used by login 2FA.

Active usage:

- `email` is actively used for login and email 2FA.
- `mobile_number` is stored and validated by format, but not used for 2FA.

### Migration references

Files:

- `backend/src/main/resources/db/migration/V14__organization_holders_memberships_2fa.sql`
- `backend/src/main/resources/db/migration/V15__remove_unsafe_seed_data.sql`

Notes:

- `V14` creates `two_factor_verifications` and its index.
- `V15` deletes `two_factor_verifications` rows only when deleting known unsafe seeded users.
- No other migration adds ownership-verification flags such as `email_verified`, `mobile_verified`, or per-user 2FA preferences.

## 4. Existing 2FA API Surface

### `POST /api/auth/login`

Controller:

- `backend/src/main/java/com/fapor7/fms/auth/AuthController.java`

Request DTO:

- `LoginRequest`
- Fields: `email`, `password`

Response DTO:

- `LoginResponse`
- Fields: `token`, `twoFactorRequired`, `challengeId`, `channel`, `maskedDestination`, `expiresAt`

Current behavior:

- With email 2FA disabled: returns a JWT immediately.
- With email 2FA enabled: creates an email challenge, sends/logs the code through `EmailCodeSender`, and returns:
  - `token: null`
  - `twoFactorRequired: true`
  - `challengeId: <uuid>`
  - `channel: "EMAIL"`
  - `maskedDestination: <masked email>`
  - `expiresAt: <timestamp>`

Expected status codes:

- No explicit status codes are configured. Successful responses are HTTP 200.
- Auth and 2FA failures throw `RuntimeException`.
- There is no `@ControllerAdvice` or endpoint-specific exception mapping, so these failures are expected to surface as generic server errors instead of intentional `400`, `401`, or `429` responses.

Completeness:

- Complete enough for email challenge creation.
- Incomplete for SMS, channel selection, structured error responses, and input validation annotations.

### `POST /api/auth/2fa/verify`

Controller:

- `backend/src/main/java/com/fapor7/fms/auth/AuthController.java`

Request DTO:

- `VerifyTwoFactorRequest`
- Fields: `challengeId`, `code`

Response DTO:

- `LoginResponse`
- Successful fields:
  - `token: <jwt>`
  - `twoFactorRequired: false`
  - `challengeId: null`
  - `channel: null`
  - `maskedDestination: null`
  - `expiresAt: null`

Current behavior:

- Loads the pending challenge.
- Rejects missing, unknown, non-pending, expired, consumed, over-attempt, or invalid-code challenges.
- On correct code, sets status to `VERIFIED`, sets `verifiedAt` and `consumedAt`, saves the challenge, and issues a JWT.

Expected status codes:

- Success: HTTP 200.
- Failure: no explicit mapping; likely generic error response from Spring Boot for thrown `RuntimeException`.

Completeness:

- Complete for email challenge verification.
- No tests currently cover this controller endpoint.

### `POST /api/auth/2fa/resend`

Controller:

- `backend/src/main/java/com/fapor7/fms/auth/AuthController.java`

Request DTO:

- `ResendTwoFactorRequest`
- Fields: `challengeId`

Response DTO:

- `LoginResponse`
- Successful challenge fields:
  - `token: null`
  - `twoFactorRequired: true`
  - `challengeId`
  - `channel`
  - `maskedDestination`
  - `expiresAt`

Current behavior:

- Requires a pending challenge.
- Enforces resend cooldown.
- Rejects expired challenges and marks them `EXPIRED`.
- Generates a fresh code, replaces `codeHash`, increments `resendCount`, updates `lastSentAt`, sends/logs the code, and returns the updated challenge response.

Expected status codes:

- Success: HTTP 200.
- Failure: no explicit mapping; likely generic error response from Spring Boot for thrown `RuntimeException`.

Completeness:

- Complete for email challenge resend.
- `resendCount` is tracked but no maximum resend limit is enforced.
- No tests currently cover this controller endpoint.

### `POST /api/auth/register`

Controller:

- `backend/src/main/java/com/fapor7/fms/auth/AuthController.java`

Request DTO:

- `RegisterRequest`
- Fields: `fullName`, `email`, `password`, `mobileNumber`, `organizationIds`, `organizationId`

Response DTO:

- `UserResponse`

Current behavior:

- Creates a pending end-user account.
- Does not issue a JWT.
- Does not send email or SMS verification.
- Does not create a 2FA challenge.

Completeness:

- Not a 2FA endpoint.
- Relevant because it captures `mobileNumber` for future SMS verification.

### SSO routes

Controllers:

- Spring Security OAuth2 login, configured by `SecurityConfig`.

Routes:

- `/oauth2/authorization/entra`
- `/login/oauth2/code/entra`
- `/oauth2/authorization/google`
- `/login/oauth2/code/google`

Current behavior:

- Routes are permitted only when SSO is enabled.
- SSO success is bridged by `SsoAuthenticationSuccessHandler`.
- The app JWT is returned to frontend through `SSO_FRONTEND_SUCCESS_URI#sso_token=<jwt>`.

2FA behavior:

- No app 2FA challenge is created.

## 5. Existing 2FA Services and Logic

### `AuthService`

File:

- `backend/src/main/java/com/fapor7/fms/auth/AuthService.java`

Responsibilities:

- Validates local email/password credentials.
- Checks account status.
- Delegates to `TwoFactorService` when email 2FA is enabled.
- Issues JWT immediately when email 2FA is disabled.
- Issues JWT after successful 2FA verification.
- Handles SSO user lookup/provisioning and immediate SSO JWT issuance.

2FA-specific behavior:

- Local password login checks `twoFactorService.isEmailEnabled()`.
- If true, local login returns a 2FA challenge response without token.
- If false, local login returns a token immediately.
- SSO does not call `TwoFactorService`.

### `TwoFactorService`

File:

- `backend/src/main/java/com/fapor7/fms/auth/TwoFactorService.java`

Responsibilities:

- Generate numeric OTP codes.
- Store hashed OTP challenges.
- Send/log email codes through `EmailCodeSender`.
- Enforce challenge creation limits.
- Enforce resend cooldown.
- Enforce expiry.
- Track failed attempts.
- Verify and consume pending challenges.

Configuration:

| Property | Environment variable | Default |
| --- | --- | --- |
| `app.two-factor.email.enabled` | `APP_2FA_EMAIL_ENABLED` | Base false, local true, dev false, prod false |
| `app.two-factor.email.log-codes` | `APP_2FA_EMAIL_LOG_CODES` | Base false, local true, dev false, prod false |
| `app.two-factor.code-length` | `APP_2FA_CODE_LENGTH` | `6` |
| `app.two-factor.expiry-minutes` | `APP_2FA_EXPIRY_MINUTES` | `10` |
| `app.two-factor.resend-cooldown-seconds` | `APP_2FA_RESEND_COOLDOWN_SECONDS` | `60` |
| `app.two-factor.max-failed-attempts` | `APP_2FA_MAX_FAILED_ATTEMPTS` | `5` |
| `app.two-factor.max-challenges-per-hour` | `APP_2FA_MAX_CHALLENGES_PER_HOUR` | `5` |

OTP generation:

- Uses `SecureRandom`.
- Generates a numeric code.
- Enforces a minimum code length of 4 digits.
- Default code length is 6 digits.

OTP storage:

- Saves a `TwoFactorVerificationEntity`.
- Stores `PasswordEncoder.encode(code)` in `codeHash`.
- Uses BCrypt through the shared `PasswordEncoder` bean.

OTP expiry:

- Default is 10 minutes.
- Expired challenges are marked `EXPIRED` when encountered during resend or verify.

Attempt limits:

- Default max failed attempts is 5.
- `failedAttemptCount` increments on invalid codes.
- When `failedAttemptCount >= maxFailedAttempts`, verification is rejected.
- The challenge is not marked expired or locked when the attempt limit is reached.

Resend cooldown:

- Default is 60 seconds.
- Resend is blocked if `lastSentAt + cooldown` is still in the future.
- `resendCount` increments on successful resend.
- No maximum resend count is enforced.

Challenge creation limit:

- Default max is 5 challenges per user per hour.
- Counts all challenges created after `now - 1 hour`.

Token issuance after verification:

- `TwoFactorService.verify` returns the owning `UserEntity`.
- `AuthService.verifyTwoFactor` generates the JWT after successful verification.
- JWT is not issued by `TwoFactorService` itself.

Important behavior notes:

- New login attempts can create additional pending challenges after cooldown even if an older pending challenge still exists.
- The verification endpoint accepts any valid pending challenge ID and code; there is no separate pre-auth session binding beyond the high-entropy challenge UUID and OTP.
- `maskDestination` currently handles email masking only. SMS masking is not implemented.

### `EmailCodeSender`

File:

- `backend/src/main/java/com/fapor7/fms/notifications/EmailCodeSender.java`

Responsibilities:

- Interface for sending email verification codes.

Active implementation:

- `LoggingEmailCodeSender`

### `LoggingEmailCodeSender`

File:

- `backend/src/main/java/com/fapor7/fms/notifications/LoggingEmailCodeSender.java`

Responsibilities:

- Logs the email 2FA code when `app.two-factor.email.log-codes` is true.
- Logs "delivery is not configured" when code logging is false.

Completeness:

- Suitable for local development only.
- Not a real email integration.

### `JwtService`

File:

- `backend/src/main/java/com/fapor7/fms/auth/JwtService.java`

Responsibilities:

- Generates signed JWTs.
- Validates JWTs.
- Extracts the user UUID from token subject.

Token content:

- Subject: user UUID.
- Claim: `email`.
- Expiration: `app.jwt.expiration-ms`, default `86400000`.
- Signing: HS256 secret from `app.jwt.secret`.

Refresh tokens:

- No refresh token implementation exists.

### `JwtAuthenticationFilter`

File:

- `backend/src/main/java/com/fapor7/fms/auth/JwtAuthenticationFilter.java`

Responsibilities:

- Reads `Authorization: Bearer <token>`.
- Validates JWT.
- Loads user by UUID.
- Sets Spring Security context.

### `SecurityConfig`

File:

- `backend/src/main/java/com/fapor7/fms/config/SecurityConfig.java`

Responsibilities:

- Permits `/api/auth/login`, `/api/auth/2fa/verify`, `/api/auth/2fa/resend`, and `/api/auth/register`.
- Permits SSO routes only when SSO is enabled.
- Uses stateless sessions by default.
- Uses `SessionCreationPolicy.IF_REQUIRED` when SSO is enabled because OAuth redirect flow needs temporary session state.
- Adds `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`.

## 6. Existing Email/SMS Integrations

### Email sending

Existing code:

- `EmailCodeSender`
- `LoggingEmailCodeSender`

Current capability:

- Local/logging only.
- No real email transport.
- If logging is disabled, `LoggingEmailCodeSender` only logs that email delivery is not configured.

Azure Communication Services Email:

- No Azure Communication Services Email sender class exists.
- No ACS Email dependency was found in `backend/pom.xml`.
- No ACS Email config properties or environment variables were found.
- No use of `EmailClient` or `azure-communication-email` was found.

SMTP or other email provider:

- No SMTP configuration was found.
- No `spring.mail.*`, `JavaMailSender`, SendGrid, or Mailgun integration was found.

### SMS sending

Existing code:

- `backend/src/main/java/com/fapor7/fms/notifications/SmsSender.java`
- `backend/src/main/java/com/fapor7/fms/notifications/SmsConfiguration.java`
- `backend/src/main/java/com/fapor7/fms/notifications/SemaphoreSmsSender.java`
- `backend/src/main/java/com/fapor7/fms/notifications/SemaphoreSmsProperties.java`
- `backend/src/main/java/com/fapor7/fms/notifications/NoOpSmsSender.java`

Semaphore configuration:

| Property | Environment variable | Default |
| --- | --- | --- |
| `app.sms.semaphore.enabled` | `APP_2FA_SMS_ENABLED` | `false` |
| `app.sms.semaphore.api-key` | `SEMAPHORE_API_KEY` | blank |
| `app.sms.semaphore.sender-name` | `SEMAPHORE_SENDER_NAME` | blank |
| `app.sms.semaphore.base-url` | `SEMAPHORE_BASE_URL` | `https://api.semaphore.co/api/v4/messages` |

Current capability:

- When disabled, `SmsConfiguration` exposes `NoOpSmsSender`.
- When enabled, it exposes `SemaphoreSmsSender`.
- `SemaphoreSmsSender` posts form-encoded fields `apikey`, `number`, `message`, and optional `sendername` to the configured Semaphore URL.

Completeness:

- SMS provider plumbing exists.
- SMS 2FA is not wired into `TwoFactorService` or `AuthService`.
- No code creates an `SMS` challenge.
- No tests cover `SemaphoreSmsSender`, `SmsConfiguration`, or SMS 2FA behavior.

## 7. Frontend Expectations

Files:

- `frontend/src/lib/api.ts`
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/App.tsx`
- `frontend/src/lib/backendPaths.ts`

### Token storage

- Token key: `fapor7.jwt`.
- Storage: browser `localStorage`.
- API auth header: `Authorization: Bearer <jwt>`.

### Local login request

Route:

- `POST /api/auth/login`

Body:

```json
{
  "email": "user@example.test",
  "password": "secret"
}
```

Expected non-2FA response:

```json
{
  "token": "<jwt>",
  "twoFactorRequired": false,
  "challengeId": null,
  "channel": null,
  "maskedDestination": null,
  "expiresAt": null
}
```

Frontend behavior:

- If `response.token` exists, `onLoggedIn(response.token)` stores it and loads `/api/me`.

### 2FA-required login response

Expected response:

```json
{
  "token": null,
  "twoFactorRequired": true,
  "challengeId": "<uuid>",
  "channel": "EMAIL",
  "maskedDestination": "u***@example.test",
  "expiresAt": "2026-06-01T09:50:00"
}
```

Frontend behavior:

- Switches to verification-code form only if all of these are present:
  - `twoFactorRequired`
  - `challengeId`
  - `channel`
  - `maskedDestination`
  - `expiresAt`
- `channel` type allows `EMAIL` or `SMS`.
- UI text does not distinguish email from SMS; it says "Verification code sent to ...".

### OTP verify request

Route:

- `POST /api/auth/2fa/verify`

Body:

```json
{
  "challengeId": "<uuid>",
  "code": "123456"
}
```

Expected response:

```json
{
  "token": "<jwt>"
}
```

Actual backend response also includes the other `LoginResponse` fields as false/null values.

Frontend behavior:

- Calls `onLoggedIn(response.token)`.
- Does not check for missing token in the verify response.

### OTP resend request

Route:

- `POST /api/auth/2fa/resend`

Body:

```json
{
  "challengeId": "<uuid>"
}
```

Expected response:

```json
{
  "token": null,
  "twoFactorRequired": true,
  "challengeId": "<uuid>",
  "channel": "EMAIL",
  "maskedDestination": "u***@example.test",
  "expiresAt": "2026-06-01T09:50:00"
}
```

Frontend behavior:

- Replaces the current challenge state with the response.
- Clears the entered verification code.

### SSO frontend expectations

- Login buttons navigate to:
  - `/oauth2/authorization/entra`
  - `/oauth2/authorization/google`
- `backendUrl` prefixes these with `VITE_API_BASE_URL` only when configured.
- `App.tsx` reads `#sso_token=<jwt>` from the URL fragment, stores the JWT in `localStorage`, removes the fragment from the URL, and loads the session.

## 8. Tests

Command run:

```powershell
.\mvnw.cmd test
```

Working directory:

```text
backend
```

Result:

- Build result: `BUILD SUCCESS`
- Tests run: `175`
- Failures: `0`
- Errors: `0`
- Skipped: `0`

Auth-related tests found:

| Test file | Coverage summary | Result |
| --- | --- | --- |
| `backend/src/test/java/com/fapor7/fms/auth/AuthControllerTest.java` | Delegates login and register to service. Does not cover 2FA endpoints. | 2 passed |
| `backend/src/test/java/com/fapor7/fms/auth/AuthServiceTest.java` | Local login without enabled 2FA, invalid credentials, inactive users, registration, SSO existing/provisioning/inactive/error cases. | 9 passed |
| `backend/src/test/java/com/fapor7/fms/auth/JwtServiceTest.java` | JWT generation, validation, secret validation, local/dev/prod secret rules. | 6 passed |
| `backend/src/test/java/com/fapor7/fms/auth/JwtAuthenticationFilterTest.java` | Missing/valid/invalid bearer token handling. | 3 passed |
| `backend/src/test/java/com/fapor7/fms/auth/CustomUserDetailsServiceTest.java` | User lookup by email and ID. | 4 passed |
| `backend/src/test/java/com/fapor7/fms/auth/AuthenticatedUserTest.java` | Principal credentials and authorities. | 1 passed |
| `backend/src/test/java/com/fapor7/fms/auth/SsoAuthenticationSuccessHandlerTest.java` | SSO success redirects to frontend with encoded JWT fragment. | 1 passed |
| `backend/src/test/java/com/fapor7/fms/config/ProdEnvironmentValidatorTest.java` | Prod safety validation, including disabled 2FA code logging path via constructor defaults but no explicit 2FA logging rejection test. | 5 passed |

2FA test gaps:

- No `TwoFactorServiceTest`.
- No repository/integration test for `two_factor_verifications`.
- No controller test for `POST /api/auth/2fa/verify`.
- No controller test for `POST /api/auth/2fa/resend`.
- No test that local login returns a challenge when `twoFactorService.isEmailEnabled()` is true.
- No test that JWT is withheld until OTP verification.
- No test for OTP expiry.
- No test for max failed attempts.
- No test for resend cooldown.
- No test for max challenges per hour.
- No test for code hashing.
- No test for SMS sender wiring.
- No test for Semaphore sender behavior.
- No test for real email delivery.

Tooling note:

- The Maven test output included JaCoCo instrumentation stack traces with `Unsupported class file major version 69`, but Maven still reported `BUILD SUCCESS` and Surefire reported all tests passing. This is a test tooling warning to track separately.

## 9. What Is Working

Confirmed by code and compilation/tests:

- The backend compiles with the existing 2FA classes.
- `two_factor_verifications` is present in Flyway migration `V14`.
- Local password login can branch to a 2FA challenge when email 2FA is enabled.
- Challenge responses use the existing `LoginResponse` shape expected by the frontend.
- OTP codes are generated with `SecureRandom`.
- OTP codes are stored as BCrypt hashes.
- OTP verification consumes the challenge and then issues a JWT.
- Resend creates a fresh code hash and updates `lastSentAt`.
- The frontend has a working UI path for challenge entry and resend.
- SSO token handoff through `#sso_token=<jwt>` is tested.
- JWT generation and bearer-token authentication are tested.

Confirmed by current test run:

- All backend tests passed: 175 run, 0 failures, 0 errors.
- Existing auth/JWT/SSO tests passed.

Likely working locally only:

- Email 2FA with logged codes when running the `local` profile with default `APP_2FA_EMAIL_ENABLED=true` and `APP_2FA_EMAIL_LOG_CODES=true`.

## 10. What Is Not Working or Missing

Email delivery:

- No Azure Communication Services Email integration exists.
- No SMTP or other real email integration exists.
- Enabling email 2FA in dev/prod without adding a sender will create login challenges but not deliver usable codes.

SMS 2FA:

- `SMS` is present in the channel enum.
- `SmsSender`, `SemaphoreSmsSender`, and `SemaphoreSmsProperties` exist.
- `TwoFactorService` does not inject or call `SmsSender`.
- No login request can select SMS.
- No SMS challenge creation exists.
- No SMS destination masking exists.

Authenticator apps:

- No TOTP/authenticator-app model, secret storage, enrollment, QR provisioning, or verification exists.

Account contact verification:

- No `email_verified` field.
- No `mobile_verified` field.
- No separate email/mobile ownership verification flow.
- The existing table is a login challenge table, not a contact ownership verification system.

Error handling:

- Auth and 2FA service failures throw generic `RuntimeException`.
- No explicit `400`, `401`, `404`, `409`, or `429` mapping exists for auth/2FA failures.
- Frontend error parsing is generic and may show fallback server-error text instead of the service messages.

Validation:

- Auth DTOs do not use validation annotations such as required, email format, code length, or UUID constraints.
- Controller methods do not use `@Valid`.

Challenge lifecycle:

- Max failed attempts do not mark a challenge as locked/expired.
- Multiple pending challenges can exist for one user after cooldown.
- No background cleanup removes expired or consumed challenges.
- No maximum resend count is enforced even though `resend_count` is stored.

Login/account behavior:

- Local login uses exact `findByEmail`, while SSO uses case-insensitive email lookup. Since stored emails are normalized at creation, uppercase login input may fail for local login.
- No per-user or per-role 2FA policy exists. Email 2FA is global by environment property.
- No frontend channel selector exists.
- No explicit policy confirms that SSO should rely on provider MFA and skip app OTP.

Tests:

- No direct 2FA tests exist.
- Existing `AuthServiceTest.loginReturnsTokenForActiveUserWithMatchingPassword` covers only the 2FA-disabled path.

## 11. Current Code Expectations

Conceptually, the current code expects 2FA to mean login challenge verification, not account contact ownership verification.

Specific expectations:

- `two_factor_verifications` stores login challenges.
- Local password login may require 2FA depending on `app.two-factor.email.enabled`.
- If local password 2FA is required, JWT is issued after `POST /api/auth/2fa/verify`, not during initial login.
- If local password 2FA is disabled, JWT is issued immediately by `POST /api/auth/login`.
- Microsoft Entra and Google SSO do not use the 2FA challenge table.
- SSO and local login share `JwtService` for final token issuance.
- SSO and local login are separate AuthService methods:
  - `login` for password login.
  - `loginSso` for provider login.
- Frontend expects a single `LoginResponse` shape for both direct-token and challenge-required login responses.
- Frontend expects SSO token delivery through URL fragment `sso_token`.
- Token/session mechanism is JWT in `localStorage` plus `Authorization: Bearer`.
- No refresh tokens exist.
- No normal API auth cookies exist.
- SSO uses temporary backend session state only during OAuth redirect flow when SSO is enabled.

## 12. Recommended Implementation Plan

1. Freeze the initial 2FA scope.

   Apply app-level 2FA only to local username/password login for now. Keep Microsoft Entra ID and Google SSO unchanged, and document that they rely on the identity provider's MFA/conditional-access policy until the product explicitly requires app-side SSO OTP.

2. Add focused tests before changing behavior.

   Add unit tests for `TwoFactorService` covering challenge creation, code hashing, expiry, invalid attempts, max attempts, resend cooldown, max challenges per hour, successful verification, and no-JWT-before-verify behavior. Add `AuthService` tests for 2FA-enabled login. Add `AuthController` tests for `/api/auth/2fa/verify` and `/api/auth/2fa/resend`.

3. Add structured auth/2FA error handling.

   Introduce typed exceptions or an auth exception hierarchy and map them to intentional HTTP statuses. Recommended mapping:

   - Invalid email/password: `401`
   - Inactive account: `403`
   - Missing/invalid request fields: `400`
   - Unknown/expired/consumed challenge: `400` or `401`
   - Too many failed attempts or resend/challenge rate limit: `429`

4. Keep using the existing `two_factor_verifications` table for login OTP.

   The table already supports the needed login challenge fields for email and SMS. Do not mix long-lived email/mobile ownership state into this table unless a `purpose` column is added. If account contact verification is needed later, add explicit user fields or a separate verification-purpose model.

5. Add Azure Communication Services Email delivery.

   Add a production `EmailCodeSender` implementation backed by Azure Communication Services Email. Add configuration properties for connection string or endpoint/credential, sender address, subject/template, enabled flag, and local logging behavior. Keep `LoggingEmailCodeSender` only for local/dev diagnostics and ensure prod cannot log raw OTPs.

6. Wire SMS OTP through Semaphore.

   Extend `TwoFactorService` to support `SMS` challenge creation using the existing `SmsSender`. Use `UserEntity.mobileNumber` as destination only when present and valid. Add SMS message text configuration. Keep Semaphore disabled by default unless credentials are configured.

7. Define channel selection.

   Choose one of these explicitly:

   - Server default: email first, SMS fallback only when email delivery unavailable.
   - User choice: initial login returns available channels, then frontend requests one.
   - Account preference: persisted per-user default channel.

   For safest incremental delivery, start with email only in production, then add SMS as an explicit second step after tests and provider validation.

8. Update the frontend only after backend contract is stable.

   If channel choice is added, update `LoginPage` and `frontend/src/lib/api.ts` to request the selected channel. If no choice is added, keep the existing challenge UI and improve display text for `EMAIL` vs `SMS`.

9. Preserve the no-JWT-before-OTP invariant.

   Keep initial local login returning `token = null` when 2FA is required. Only `POST /api/auth/2fa/verify` should return the JWT.

10. Harden lifecycle and limits.

   Consider marking over-attempt challenges as `EXPIRED` or adding a `LOCKED` status. Prevent or invalidate older pending challenges when a new one is created. Add a max resend limit or intentionally remove unused `resend_count`. Add cleanup for expired/consumed challenge records.

11. Add configuration documentation.

   Document all email/SMS settings in `docs/azure-environments.md` and local setup docs. Keep all secrets as environment variables or Azure App Service settings, never in source.

12. Verify end to end.

   Run backend tests, then manual local flow with logged email codes. After ACS Email and Semaphore are configured in a non-production environment, run smoke tests for email OTP and mobile OTP. Keep SSO smoke tests unchanged.

## 13. Risks and Open Questions

- Should 2FA apply to all local users or only privileged roles?
- Should local 2FA be globally required, per-account opt-in, or per-role?
- Should SSO intentionally rely on Entra/Google MFA policies, and should that be documented as a security requirement?
- Should the app support email and SMS simultaneously, or start with one required channel?
- If both email and SMS are available, who chooses the channel: user, admin, or server policy?
- Is mobile number ownership required before SMS can be used for login 2FA?
- Should email ownership be verified before email can be used for login 2FA?
- Should the same `two_factor_verifications` table be extended with a `purpose` column if account contact verification is added later?
- What retention period should apply to expired/consumed 2FA challenge rows?
- Should challenge IDs be bound to a short-lived pre-auth session or client fingerprint, or is UUID plus OTP acceptable?
- What exact ACS Email authentication mode will be used: connection string, managed identity, or another credential flow?
- What ACS Email sender address/domain is approved for dev/prod?
- What Semaphore sender name and quota are approved for production?
- Should OTP messages be localized or branded?
- Should OTPs be numeric-only with 6 digits, or should code length/policy change?
- Should failed login and failed OTP attempts share a lockout policy?
- Should auth failures return generic messages to avoid account enumeration?
- Should local login use case-insensitive email lookup like SSO?
