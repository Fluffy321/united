import { corsHeaders } from 'npm:@supabase/supabase-js@2.105.3/cors';
import { createTrafficFunctionHandler } from './handler.ts';

const handler = createTrafficFunctionHandler({
  apiKey: Deno.env.get('NY511_API_KEY') || '',
  fetchImpl: fetch,
  now: () => new Date(),
  corsHeaders,
});

Deno.serve(handler);
