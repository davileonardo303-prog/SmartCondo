# SmartCondo — Base44 Dev Environment

## Stack
Vite 6 + React 19 + Express 4, written in TypeScript. Single process: `tsx server.ts`
runs an Express server on port 3000 that mounts Vite in middleware mode (`appType: 'spa'`)
for dev, so the API (`/api/*`) and the React app share one origin. Tailwind v4 via
`@tailwindcss/vite`.

## Running it
```
docker compose -f docker-compose.base44.yml up -d
```
- Base image: `node:22-slim`. Source is bind-mounted at `/app`; `node_modules` is an
  anonymous volume so the host tree doesn't shadow it.
- Startup runs `npm install` then `npx tsx server.ts`.
- Health check: `GET /api/health` → `{"status":"ok"}`.

## External access / preview host
Vite rejects unknown Host headers by default (returns 403). `vite.config.ts` sets
`server.host: true` and `server.allowedHosts: true` so the preview's external hostname
is accepted. Keep these when editing the config.

## Credentials / secrets
- Firebase config (project, API key, appId, Firestore database id) is hardcoded in
  `firebase-applet-config.json` — no secret needed to boot.
- `GEMINI_API_KEY` is listed in `.env.example` but is **not referenced anywhere in the
  source**; `@google/genai` is a dependency but unused. A placeholder is provided via
  `.env.base44-defaults` so the app boots without it. No `set_secrets` is required.
- `APP_URL` defaults to `http://localhost:3000` in `.env.base44-defaults`.

## Data
The app uses Firebase (Firestore + Auth) for remote sync and a local `mockStorage`
(`src/services/mockStorage.ts`) for reactive client state. No local database service
is needed.

## Notes
- `DISABLE_HMR=true` disables Vite HMR + file watching (used during bulk agent edits).
  Default in compose is `false` so live reload works.
- Build/preview scripts (`npm run build`, `npm run preview`) exist but the dev setup
  uses the Express + Vite-middleware dev server only.
