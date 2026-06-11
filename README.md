# Slack Off Mobile

Expo mobile app for Slack Off.

## Environment Config

Copy the example file:

```bash
cp .env.example .env
```

Expo exposes only variables prefixed with `EXPO_PUBLIC_` to the mobile bundle.

Required:

- `EXPO_PUBLIC_API_BASE_URL`: API base URL.

Optional:

- `EXPO_PUBLIC_APP_ENV`: `local`, `staging`, or `production`.

## Local Run

Run against a local API:

```bash
EXPO_PUBLIC_APP_ENV=local EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm start
```

or:

```bash
npm run start:local
```

## Staging Run

Set a staging HTTPS API URL before starting Expo:

```bash
EXPO_PUBLIC_APP_ENV=staging EXPO_PUBLIC_API_BASE_URL=https://staging-api.example.com npm start
```

or use `.env` and:

```bash
npm run start:staging
```

## Production Build Notes

Do not ship release builds with `localhost`, `127.0.0.1`, or private LAN API URLs.

Before a release build:

1. Set `EXPO_PUBLIC_APP_ENV=production`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to the production HTTPS API URL.
3. Run typecheck:

```bash
npx tsc --noEmit
```

4. Start the app once and confirm API calls return production/staging `traceId` values.

## Observability

The app creates `X-Request-Id` and `X-Trace-Id` headers for API calls and buffers local analytics/log events through `src/observability/logger.ts`.

For a user-reported issue:

1. Find `traceId` in the mobile log event.
2. Search API logs for the same `trace_id`.
3. Search backend audit events and reward ledger metadata by that trace.
4. Verify the related check-in, leaderboard, bean, achievement, cosmetic, or activity side effect.
