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
  if (configuredAuthRedirectUrl) return configuredAuthRedirectUrl;
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/login`;
};

export const getSupabaseConfigStatus = () => ({
  hasUrl: Boolean(supabaseUrl),
  hasAnonKey: Boolean(supabaseAnonKey),
  isSupabaseEnabled,
  shouldUseSupabase,
  authRedirectUrl: configuredAuthRedirectUrl || null,
});
