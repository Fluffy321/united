import { getSupabaseConfigStatus } from '@/api/supabaseClient';

const supabaseConfig = getSupabaseConfigStatus();

export const appParams = {
  appId: 'junited-local',
  token: null,
  fromUrl: typeof window === 'undefined' ? '/' : window.location.href,
  functionsVersion: 'local',
  appBaseUrl: supabaseConfig.hasUrl ? supabaseConfig.supabaseUrl : '',
  hasBackendConfig: supabaseConfig.shouldUseSupabase,
  backendProvider: supabaseConfig.shouldUseSupabase ? 'supabase' : 'local-demo',
};
