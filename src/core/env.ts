const appEnv = process.env.EXPO_PUBLIC_APP_ENV ?? 'development';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const explicitDemo = process.env.EXPO_PUBLIC_ENABLE_DEMO_MODE === 'true';

function isConfiguredValue(value: string | undefined): value is string {
  if (!value) return false;
  return !/(YOUR_PROJECT|REPLACE_ME|example\.com|localhost-placeholder)/i.test(value);
}

const validSupabaseUrl = isConfiguredValue(supabaseUrl) && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl);
const validPublishableKey = isConfiguredValue(supabaseKey) && (supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('eyJ'));
const isSupabaseConfigured = Boolean(validSupabaseUrl && validPublishableKey);
const configurationErrors = [
  ...(!validSupabaseUrl ? ['EXPO_PUBLIC_SUPABASE_URL is missing or invalid.'] : []),
  ...(!validPublishableKey ? ['EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing or invalid.'] : [])
];

export const env = {
  appEnv,
  supabaseUrl: validSupabaseUrl ? supabaseUrl : undefined,
  supabasePublishableKey: validPublishableKey ? supabaseKey : undefined,
  demoMode: explicitDemo || (appEnv !== 'production' && !isSupabaseConfigured),
  isSupabaseConfigured,
  configurationErrors,
  preferProviderMessaging: process.env.EXPO_PUBLIC_PREFER_PROVIDER_MESSAGING !== 'false',
  useCloudTelephony: process.env.EXPO_PUBLIC_USE_CLOUD_TELEPHONY === 'true'
} as const;

export function assertProductionConfiguration(): void {
  if (env.appEnv === 'production' && !env.isSupabaseConfigured) {
    throw new Error(`DentaFlow production configuration is incomplete: ${env.configurationErrors.join(' ')}`);
  }
  if (env.appEnv === 'production' && env.demoMode) {
    throw new Error('Demo mode must be disabled for a production deployment.');
  }
}
