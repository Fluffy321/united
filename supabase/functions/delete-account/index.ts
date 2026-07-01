import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

// Deletes the caller's own account. Two-step, in that order:
// 1. Call public.delete_my_account() AS the caller (their own JWT) so
//    auth.uid() inside the RPC resolves correctly and the security check
//    in the function body is meaningful (not bypassable via service role).
// 2. Only after that succeeds, remove the auth.users row via the admin API
//    (requires the service-role key — cannot be done from the client).
// If step 1 fails, step 2 is never reached, so a partially-anonymized
// account is never left with its login also revoked.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return errorResponse(405, 'Method not allowed');
  }

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return errorResponse(401, 'Missing bearer token');
  }
  const jwt = authHeader.replace('Bearer ', '');

  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userError } = await callerClient.auth.getUser(jwt);
  if (userError || !userData?.user) {
    return errorResponse(401, 'Invalid or expired session');
  }
  const userId = userData.user.id;

  const { error: rpcError } = await callerClient.rpc('delete_my_account');
  if (rpcError) {
    console.error('delete_my_account RPC failed:', rpcError.message);
    return errorResponse(500, 'Could not delete account data. Please try again.');
  }

  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userId);
  if (deleteAuthError) {
    // Data is already anonymized at this point; the auth record is the only
    // thing left dangling. Log loudly so an admin can finish it manually.
    console.error('auth.admin.deleteUser failed after successful data anonymization:', deleteAuthError.message, 'userId:', userId);
    return errorResponse(500, 'Account data was deleted but sign-in could not be fully revoked. Please contact support@junited.org.');
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
});
