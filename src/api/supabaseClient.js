import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseEnabled = import.meta.env.VITE_SUPABASE_ENABLED === 'true';
export const configuredAuthRedirectUrl = import.meta.env.VITE_AUTH_REDIRECT_URL;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const shouldUseSupabase = isSupabaseEnabled && !!supabase;

export const getAuthRedirectUrl = () => {
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined;

  // In production builds, reject any localhost redirect URL — it almost always
  // means the env.example placeholder was copied into production without being
  // updated. Fall back to the actual origin so OAuth still works.
  if (
    configuredAuthRedirectUrl &&
    import.meta.env.PROD &&
    /localhost|127\.0\.0\.1/.test(configuredAuthRedirectUrl)
  ) {
    console.error(
      '[JUnited] VITE_AUTH_REDIRECT_URL is set to a localhost address in a production build. ' +
        'Set it to your production URL (e.g. https://your-domain.com/login). ' +
        'Falling back to window.location.origin to avoid broken OAuth redirects.'
    );
    return origin ? `${origin}/login` : undefined;
  }

  if (configuredAuthRedirectUrl) return configuredAuthRedirectUrl;
  return origin ? `${origin}/login` : undefined;
};

export const getSupabaseConfigStatus = () => ({
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  isSupabaseEnabled,
  shouldUseSupabase,
  supabaseUrl: supabaseUrl || null,
  authRedirectUrl: configuredAuthRedirectUrl || null,
});
