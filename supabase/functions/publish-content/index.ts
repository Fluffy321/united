import { createClient } from 'npm:@supabase/supabase-js@2';
import { handlePublishingRequest } from '../_shared/publishing.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

Deno.serve((request) => handlePublishingRequest(request, {
  createUserClient: (authorization) => createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: authorization } },
  }),
}));
