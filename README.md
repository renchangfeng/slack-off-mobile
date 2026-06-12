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
- `EXPO_PUBLIC_SUPABASE_URL`: Supabase project URL for real login.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Supabase publishable key for real login.

Optional:

- `EXPO_PUBLIC_APP_ENV`: `local`, `staging`, or `production`.
- `EXPO_PUBLIC_ACCESS_TOKEN`: explicit local/staging Bearer token fallback for smoke tests.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`: legacy fallback name for the Supabase publishable/anon key.

The app uses a restored Supabase session first. If no session exists, it falls back to `EXPO_PUBLIC_ACCESS_TOKEN` when present. If neither exists, it shows the signed-out email OTP screen and does not call private API endpoints.

## Local Run

Run against a local API:

```bash
export EXPO_PUBLIC_ACCESS_TOKEN="$(cd ../slack-off-api && SUPABASE_JWT_SECRET=dev-secret-change-me npm run auth:dev-token --silent)"
EXPO_PUBLIC_APP_ENV=local EXPO_PUBLIC_API_BASE_URL=http://localhost:3000 npm start
```

or:

```bash
npm run start:local
```

When the API is mapped to a different host port, set it explicitly:

```bash
EXPO_PUBLIC_APP_ENV=local EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3001 npm start
```

For real email OTP login, set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` instead of `EXPO_PUBLIC_ACCESS_TOKEN`.

The app scheme is `slackoff`; configure the Supabase auth redirect allow-list for the app callback URL:

```text
slackoff://auth/callback
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
Do not commit real production user access tokens, Supabase service-role keys, or server JWT secrets.

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
