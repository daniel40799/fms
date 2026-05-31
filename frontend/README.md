# FMS Frontend

React + TypeScript + Vite frontend for FAPOR7/FMS.

## Local Development

```powershell
npm ci
npm run dev
```

Local development should leave `VITE_API_BASE_URL` blank or unset. The app uses relative backend paths and `vite.config.ts` proxies `/api`, `/uploads`, `/oauth2`, and `/login/oauth2` to `http://localhost:8080`.

Expected local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`

## API Base URL

`VITE_API_BASE_URL` is optional.

| Environment | Value | Behavior |
| --- | --- | --- |
| Local | Blank/unset | Keep relative backend paths for the Vite proxy |
| Dev | Backend App Service origin | Prefix backend-owned paths so the SWA calls App Service directly |
| Prod | Blank/unset | Keep relative same-origin paths for Front Door/custom-domain routing |

When set, backend-owned paths are prefixed without double slashes:

- `/api/auth/login`
- `/uploads/profile-pictures/<filename>`
- `/oauth2/authorization/<provider>`
- `/login/oauth2/code/<provider>`
