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

## API Contract

The mobile API types in `src/api/generated.ts` are tied to the OpenAPI snapshot in `contracts/openapi/v1.yaml`.

Validate the snapshot and generated type marker:

```bash
npm run api:check
```

When working locally with the sibling API repository present, this command also checks that the mobile snapshot matches `../slack-off-api/contracts/openapi/v1.yaml`.

## Production Build Notes

Do not ship release builds with `localhost`, `127.0.0.1`, or private LAN API URLs.
Do not commit real production user access tokens, Supabase service-role keys, or server JWT secrets.

The native app identifiers are configured in `app.json`:

- iOS: `com.renchangfeng.slackoff`
- Android: `com.renchangfeng.slackoff`

Before the first store submission, confirm these identifiers match the Apple Developer and Google Play accounts. After a public release, changing them creates a different app.

Before a release build:

1. Set `EXPO_PUBLIC_APP_ENV=production`.
2. Set `EXPO_PUBLIC_API_BASE_URL` to the production HTTPS API URL.
3. Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Increment `expo.ios.buildNumber` and `expo.android.versionCode` when preparing a new store release, or let the production EAS profile auto-increment them.
5. Run validation:

```bash
npm run config:check
npm run api:check
npx tsc --noEmit
npm test
```

6. Start the app once and confirm API calls return production/staging `traceId` values.

EAS build profiles are defined in `eas.json`:

```bash
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
npx eas build --profile production --platform all
```

## Observability

The app creates `X-Request-Id` and `X-Trace-Id` headers for API calls and buffers local analytics/log events through `src/observability/logger.ts`.

For a user-reported issue:

1. Find `traceId` in the mobile log event.
2. Search API logs for the same `trace_id`.
3. Search backend audit events and reward ledger metadata by that trace.
4. Verify the related check-in, leaderboard, bean, achievement, cosmetic, or activity side effect.
