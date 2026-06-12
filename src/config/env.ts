export const env = {
  appEnv: process.env.EXPO_PUBLIC_APP_ENV ?? "local",
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000",
  accessToken: process.env.EXPO_PUBLIC_ACCESS_TOKEN ?? null,
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
  supabasePublishableKey:
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    null
};
