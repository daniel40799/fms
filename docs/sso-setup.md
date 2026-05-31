# SSO Setup

This repository has a Spring Security OpenID Connect scaffold for:

- Microsoft Entra ID through the `sso,sso-entra` Spring profiles
- Google through the `sso,sso-google` Spring profiles

The backend stays the source of authentication for the React app. Provider login starts at Spring Security, the provider redirects to the OAuth callback, the backend maps or provisions a local FAPOR7 user, and the frontend receives the existing FAPOR7 JWT in the URL fragment.

## Redirect URIs

The React login buttons use `/oauth2/authorization/...` backend paths. Local and future prod builds leave `VITE_API_BASE_URL` blank so those paths stay relative. Azure dev sets `VITE_API_BASE_URL` to the backend App Service origin, so the browser starts SSO on App Service directly.

During Vite development, `/oauth2` and `/login/oauth2` are proxied to the backend.

Register the exact callback URI used by the browser:

- Microsoft Entra through Vite: `http://127.0.0.1:5173/login/oauth2/code/entra`
- Microsoft Entra direct backend login: `http://localhost:8080/login/oauth2/code/entra`
- Microsoft Entra Azure dev App Service: `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/login/oauth2/code/entra`
- Google through Vite: `http://127.0.0.1:5173/login/oauth2/code/google`
- Google direct backend login: `http://localhost:8080/login/oauth2/code/google`
- Google Azure dev App Service: `https://app-fms-api-dev-aaghd3bmg9gthcfe.southeastasia-01.azurewebsites.net/login/oauth2/code/google`

Use the production public Front Door/custom-domain origin and the same callback path when deployed to prod. Redirect URIs must match the provider registration exactly.

## Microsoft Entra ID

1. Sign in to Azure Portal and open Microsoft Entra ID.
2. Open App registrations and choose New registration.
3. Give the app a name such as `FAPOR7 Local SSO`.
4. Choose the supported account type for the FAPOR7 tenant. For a tenant-only deployment, use accounts in this organizational directory only.
5. Add a Web redirect URI from the Microsoft Entra local redirect URI list above.
6. Register the application.
7. Copy the Directory tenant ID and Application client ID.
8. Open Certificates and secrets.
9. Create a client secret and copy its value immediately.
10. In Authentication, add any other local or production Web redirect URIs that will start the SSO login flow.

Local PowerShell backend setup:

```powershell
$env:SPRING_PROFILES_ACTIVE='local,sso,sso-entra'
$env:ENTRA_TENANT_ID='<directory-tenant-id>'
$env:ENTRA_CLIENT_ID='<application-client-id>'
$env:ENTRA_CLIENT_SECRET='<client-secret-value>'
$env:JWT_SECRET='<long-random-jwt-signing-secret-at-least-32-bytes>'
.\mvnw.cmd spring-boot:run
```

Start the frontend and use the Microsoft button on the sign-in page:

```powershell
npm run dev
```

## Google

Google sign-in uses OAuth client credentials, not an API key.

1. Open Google Cloud Console for the project that owns the OAuth consent screen.
2. Configure the OAuth consent screen and requested testing or production users as required by Google.
3. Create an OAuth client ID for a Web application.
4. Add a Google local redirect URI from the list above.
5. Copy the OAuth client ID and client secret.

Local PowerShell backend setup:

```powershell
$env:SPRING_PROFILES_ACTIVE='local,sso,sso-google'
$env:GOOGLE_CLIENT_ID='<oauth-client-id>'
$env:GOOGLE_CLIENT_SECRET='<oauth-client-secret>'
$env:JWT_SECRET='<long-random-jwt-signing-secret-at-least-32-bytes>'
.\mvnw.cmd spring-boot:run
```

Use both providers together with:

```powershell
$env:SPRING_PROFILES_ACTIVE='local,sso,sso-entra,sso-google'
```

## Current App Behavior

- Existing FAPOR7 accounts are matched by email without case sensitivity.
- A provider identity with no local account is provisioned as an active `END_USER`.
- Role elevation still stays in the FAPOR7 admin workflow. SSO does not grant administrator roles from provider claims yet.
- The backend accepts provider email-related claims in this order: `email`, `preferred_username`, then `upn`.
- The frontend stores the returned FAPOR7 JWT with the same token store used by email/password login.

## Files

- Backend shared SSO profile: `backend/src/main/resources/application-sso.yml`
- Entra provider profile: `backend/src/main/resources/application-sso-entra.yml`
- Google provider profile: `backend/src/main/resources/application-sso-google.yml`
- OAuth success bridge: `backend/src/main/java/com/fapor7/fms/auth/SsoAuthenticationSuccessHandler.java`
- Local Vite OAuth proxy: `frontend/vite.config.ts`

## Production Checklist

1. Use HTTPS public callback URIs for deployed environments.
2. Store provider secrets and `JWT_SECRET` in Azure configuration or a secret store, not in committed files.
3. Replace local frontend success URI with the deployed frontend origin:

```powershell
$env:SSO_FRONTEND_SUCCESS_URI='https://<frontend-origin>/'
```

4. Confirm app registration redirect URIs match the deployed login origin and callback path. Dev uses the backend App Service origin; prod should use the Front Door/custom-domain origin.
5. Decide whether FAPOR7 administrator roles remain local or are mapped from Entra app roles or groups before enabling provider-driven role elevation.
